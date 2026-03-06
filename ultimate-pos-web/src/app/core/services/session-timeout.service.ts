import { Injectable, OnDestroy, inject } from '@angular/core';
import { fromEvent, merge, Subscription, timer } from 'rxjs';
import { debounceTime, switchMap, tap } from 'rxjs/operators';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Auth } from '../auth/auth';
import {
  SessionTimeoutDialogComponent,
  SessionTimeoutDialogData,
} from '../components/session-timeout-dialog/session-timeout-dialog.component';

/** Minutes of inactivity before the warning dialog appears. */
const IDLE_MINUTES = 25;

/** Seconds the warning countdown runs before auto-logout. */
const WARNING_SECONDS = 5 * 60; // 5 minutes

const IDLE_MS = IDLE_MINUTES * 60 * 1000;

/** DOM events that reset the idle timer. */
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

@Injectable({ providedIn: 'root' })
export class SessionTimeoutService implements OnDestroy {
  private auth = inject(Auth);
  private dialog = inject(MatDialog);

  private activitySub?: Subscription;
  private dialogRef?: MatDialogRef<SessionTimeoutDialogComponent>;
  private running = false;

  /** Call from LayoutComponent.ngOnInit() once the user is authenticated. */
  start(): void {
    if (this.running) return;
    this.running = true;
    this.resetTimer();
  }

  /** Call from LayoutComponent.ngOnDestroy() or on logout. */
  stop(): void {
    this.running = false;
    this.activitySub?.unsubscribe();
    this.activitySub = undefined;
    this.dialogRef?.close();
    this.dialogRef = undefined;
  }

  ngOnDestroy(): void {
    this.stop();
  }

  // ────────────────────────────────────────────────────────────────────────────

  private resetTimer(): void {
    this.activitySub?.unsubscribe();

    const activity$ = merge(
      ...ACTIVITY_EVENTS.map((ev) => fromEvent(document, ev)),
    );

    // Each activity event resets the idle countdown via switchMap.
    this.activitySub = activity$
      .pipe(
        debounceTime(300), // de-bounce rapid events
        tap(() => {
          // If the dialog is open and the user interacts, treat it as "stay logged in"
          if (this.dialogRef) {
            this.handleDialogResult('refresh');
          }
        }),
        switchMap(() => timer(IDLE_MS)),
      )
      .subscribe(() => this.showWarning());

    // Also start the initial idle timer (no prior activity event needed)
    this.activitySub.add(
      timer(IDLE_MS).subscribe(() => this.showWarning()),
    );
  }

  private showWarning(): void {
    if (this.dialogRef) return; // already showing

    this.dialogRef = this.dialog.open<
      SessionTimeoutDialogComponent,
      SessionTimeoutDialogData,
      'refresh' | 'logout' | 'timeout'
    >(SessionTimeoutDialogComponent, {
      data: { warningSeconds: WARNING_SECONDS },
      disableClose: true,
      width: '420px',
      panelClass: 'session-timeout-panel',
    });

    this.dialogRef.afterClosed().subscribe((result) => {
      this.dialogRef = undefined;
      this.handleDialogResult(result ?? 'timeout');
    });
  }

  private handleDialogResult(result: 'refresh' | 'logout' | 'timeout'): void {
    this.dialogRef?.close();
    this.dialogRef = undefined;

    if (result === 'refresh') {
      this.auth.refreshToken().subscribe({
        next: () => this.resetTimer(),
        error: () => this.auth.logout(),
      });
    } else {
      // 'logout' or 'timeout'
      this.stop();
      this.auth.logout();
    }
  }
}
