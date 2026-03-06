import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private swPush = inject(SwPush);
  private http = inject(HttpClient);

  get isSupported(): boolean {
    return this.swPush.isEnabled;
  }

  /** Fetch the VAPID public key from the server and request browser permission. */
  async subscribe(): Promise<boolean> {
    if (!this.swPush.isEnabled) return false;

    try {
      const { publicKey } = await firstValueFrom(
        this.http.get<{ publicKey: string | null }>(`${API}/push/vapid-public-key`),
      );
      if (!publicKey) {
        console.warn('VAPID public key not configured on server');
        return false;
      }

      const sub = await this.swPush.requestSubscription({ serverPublicKey: publicKey });
      const { endpoint, keys } = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };

      await firstValueFrom(
        this.http.post(`${API}/push/subscribe`, { endpoint, keys }),
      );
      return true;
    } catch (err) {
      console.error('Push subscription failed:', err);
      return false;
    }
  }

  /** Remove the current browser subscription from the server and unsubscribe SW. */
  async unsubscribe(): Promise<void> {
    if (!this.swPush.isEnabled) return;
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        const { endpoint } = sub.toJSON() as { endpoint: string };
        await firstValueFrom(
          this.http.delete(`${API}/push/unsubscribe`, { body: { endpoint } }),
        );
        await sub.unsubscribe();
      }
    } catch (err) {
      console.error('Push unsubscribe failed:', err);
    }
  }

  /** Observable of incoming push messages (when the app is in the foreground). */
  get messages$() {
    return this.swPush.messages;
  }

  /** Observable emitting the current subscription (null when not subscribed). */
  get subscription$() {
    return this.swPush.subscription;
  }

  /** Check whether a push subscription currently exists for this browser. */
  async isSubscribed(): Promise<boolean> {
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      return !!sub;
    } catch {
      return false;
    }
  }

  /** Query server to see whether VAPID is configured. */
  async isServerConfigured(): Promise<boolean> {
    try {
      const { configured } = await firstValueFrom(
        this.http.get<{ configured: boolean }>(`${API}/push/status`),
      );
      return configured;
    } catch {
      return false;
    }
  }
}
