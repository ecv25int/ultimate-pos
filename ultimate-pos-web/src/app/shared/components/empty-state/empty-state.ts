import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="empty-state">
      <mat-icon class="empty-icon">{{ icon }}</mat-icon>
      <h3 class="empty-title">{{ title }}</h3>
      <p class="empty-message">{{ message }}</p>
      <a
        *ngIf="actionLabel && actionRoute"
        mat-raised-button
        color="primary"
        [routerLink]="actionRoute"
      >
        <mat-icon>add</mat-icon> {{ actionLabel }}
      </a>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
    }
    .empty-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      color: #bdbdbd;
      margin-bottom: 16px;
    }
    .empty-title {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0 0 8px;
      color: rgba(0,0,0,.7);
    }
    .empty-message {
      color: rgba(0,0,0,.5);
      margin: 0 0 24px;
      max-width: 400px;
      line-height: 1.5;
    }
  `],
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() actionLabel?: string;
  @Input() actionRoute?: string | string[];
}
