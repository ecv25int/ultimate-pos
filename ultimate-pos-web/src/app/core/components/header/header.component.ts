import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { RoleService } from '../../services/role.service';
import { Auth } from '../../auth/auth';
import { NotificationsService } from '../../services/notifications.service';
import { LanguageService, SUPPORTED_LANGUAGES } from '../../services/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <button
        mat-icon-button
        (click)="toggleSidebar()"
        class="menu-button"
      >
        <mat-icon>menu</mat-icon>
      </button>

      <span class="app-title">Ultimate POS</span>

      <span class="spacer"></span>

      <!-- Language Switcher -->
      <button mat-icon-button [matMenuTriggerFor]="langMenu" [matTooltip]="'Language'" class="header-icon-button">
        <mat-icon>translate</mat-icon>
      </button>

      <mat-menu #langMenu="matMenu">
        @for (lang of languages; track lang.code) {
          <button mat-menu-item (click)="setLanguage(lang.code)">
            <mat-icon>{{ currentLang === lang.code ? 'radio_button_checked' : 'radio_button_unchecked' }}</mat-icon>
            <span>{{ lang.label }}</span>
          </button>
        }
      </mat-menu>

      <!-- Notifications -->
      <button mat-icon-button class="header-icon-button" (click)="goToNotifications()">
        <mat-icon
          [matBadge]="notificationCount > 0 ? notificationCount : null"
          matBadgeColor="warn"
          [matBadgeHidden]="notificationCount === 0"
        >
          notifications
        </mat-icon>
      </button>

      <!-- User Menu -->
      <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-button">
        <mat-icon>account_circle</mat-icon>
      </button>

      <mat-menu #userMenu="matMenu" xPosition="before">
        <div class="user-menu-header">
          <div class="user-info">
            <div class="user-name">
              {{ currentUser?.firstName || currentUser?.username }}
            </div>
            <div class="user-role">{{ currentUser?.userType }}</div>
          </div>
        </div>
        <mat-divider></mat-divider>
        <button mat-menu-item routerLink="/profile">
          <mat-icon>person</mat-icon>
          <span>My Profile</span>
        </button>
        <button mat-menu-item>
          <mat-icon>settings</mat-icon>
          <span>Settings</span>
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon color="warn">logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [
    `
      .header-toolbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0 1rem;
      }

      .menu-button {
        margin-right: 0.5rem;
      }

      .app-title {
        font-size: 1.25rem;
        font-weight: 500;
      }

      .spacer {
        flex: 1 1 auto;
      }

      .header-icon-button {
        margin: 0 0.25rem;
      }

      .user-button {
        margin-left: 0.5rem;
      }

      .user-menu-header {
        padding: 1rem;
        background-color: #f5f5f5;
      }

      .user-info {
        display: flex;
        flex-direction: column;
      }

      .user-name {
        font-weight: 500;
        font-size: 1rem;
        color: #333;
      }

      .user-role {
        font-size: 0.875rem;
        color: #666;
        text-transform: capitalize;
      }

      ::ng-deep .mat-badge-content {
        font-size: 10px;
      }
    `,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private authService = inject(Auth);
  private roleService = inject(RoleService);
  private router = inject(Router);
  private notifService = inject(NotificationsService);
  private langService = inject(LanguageService);

  currentUser = this.authService.getCurrentUser();
  notificationCount = 0;
  languages = SUPPORTED_LANGUAGES;
  currentLang = this.langService.current.code;
  private _sub?: Subscription;
  private _langSub?: Subscription;

  ngOnInit(): void {
    this.roleService.currentUser$.subscribe((user) => {
      if (user) this.currentUser = user;
    });
    // Start polling for unread count
    this.notifService.startPolling(60_000);
    this._sub = this.notifService.unreadCount$.subscribe(
      (count) => (this.notificationCount = count),
    );
    this._langSub = this.langService.current$.subscribe(
      (lang) => (this.currentLang = lang.code),
    );
  }

  ngOnDestroy(): void {
    this._sub?.unsubscribe();
    this._langSub?.unsubscribe();
  }

  setLanguage(code: string): void {
    this.langService.use(code);
  }

  goToNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  toggleSidebar(): void {
    // Emit event to toggle sidebar
    window.dispatchEvent(new CustomEvent('toggleSidebar'));
  }

  logout(): void {
    this.authService.logout();
  }
}
