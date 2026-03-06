import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="skeleton-wrapper" [ngSwitch]="type">

      <!-- TABLE skeleton -->
      <ng-container *ngSwitchCase="'table'">
        <div class="skeleton-table-header">
          <div class="skeleton-cell shimmer" style="width: 40px; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="flex: 1; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="flex: 2; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="flex: 1; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="width: 80px"></div>
        </div>
        <div class="skeleton-row" *ngFor="let row of rowArray">
          <div class="skeleton-cell shimmer" style="width: 40px; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="flex: 1; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="flex: 2; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="flex: 1; margin-right: 8px"></div>
          <div class="skeleton-cell shimmer" style="width: 80px"></div>
        </div>
      </ng-container>

      <!-- CARD skeleton -->
      <ng-container *ngSwitchCase="'card'">
        <div class="skeleton-cards">
          <div class="skeleton-card" *ngFor="let card of rowArray">
            <div class="skeleton-card-header shimmer"></div>
            <div class="skeleton-card-line shimmer" style="width: 70%"></div>
            <div class="skeleton-card-line shimmer" style="width: 50%"></div>
            <div class="skeleton-card-line shimmer" style="width: 60%"></div>
          </div>
        </div>
      </ng-container>

      <!-- LIST skeleton (default) -->
      <ng-container *ngSwitchDefault>
        <div class="skeleton-list-item" *ngFor="let item of rowArray">
          <div class="skeleton-avatar shimmer"></div>
          <div class="skeleton-list-text">
            <div class="skeleton-cell shimmer" style="width: 60%; margin-bottom: 8px"></div>
            <div class="skeleton-cell shimmer" style="width: 40%"></div>
          </div>
        </div>
      </ng-container>

    </div>
  `,
  styles: [`
    .skeleton-wrapper {
      width: 100%;
      padding: 16px 0;
    }

    /* --- shimmer animation --- */
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }

    .shimmer {
      background: linear-gradient(90deg, #e0e0e0 25%, #f5f5f5 50%, #e0e0e0 75%);
      background-size: 800px 100%;
      animation: shimmer 1.4s infinite linear;
      border-radius: 4px;
    }

    /* --- TABLE --- */
    .skeleton-table-header {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      margin-bottom: 4px;
      height: 44px;
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      padding: 8px 16px;
      border-bottom: 1px solid #f0f0f0;
      height: 52px;
    }

    .skeleton-cell {
      height: 14px;
      min-width: 24px;
      border-radius: 4px;
    }

    /* --- CARD --- */
    .skeleton-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      padding: 0 16px;
    }

    .skeleton-card {
      flex: 1 1 280px;
      max-width: 320px;
      padding: 16px;
      border: 1px solid #f0f0f0;
      border-radius: 8px;
    }

    .skeleton-card-header {
      height: 120px;
      width: 100%;
      border-radius: 6px;
      margin-bottom: 12px;
    }

    .skeleton-card-line {
      height: 12px;
      border-radius: 4px;
      margin-bottom: 8px;
    }

    /* --- LIST --- */
    .skeleton-list-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .skeleton-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-right: 14px;
    }

    .skeleton-list-text {
      flex: 1;
    }
  `],
})
export class SkeletonLoaderComponent {
  @Input() rows = 6;
  @Input() type: 'table' | 'card' | 'list' = 'table';

  get rowArray(): number[] {
    return Array(this.rows).fill(0);
  }
}
