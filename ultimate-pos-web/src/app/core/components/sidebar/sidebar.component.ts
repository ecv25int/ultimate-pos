import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NAV_ITEMS, NavItem } from '../../config/navigation.config';
import { Auth } from '../../auth/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <mat-nav-list class="sidebar-nav">
      @for (item of filteredNavItems; track item.route) {
        <a
          mat-list-item
          [routerLink]="item.route"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
          [matTooltip]="item.label"
          matTooltipPosition="right"
          [matTooltipDisabled]="!isCollapsed"
          (click)="navItemClicked.emit()"
        >
          <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
          @if (!isCollapsed) {
            <span matListItemTitle>{{ item.label }}</span>
          }
        </a>
      }
    </mat-nav-list>
  `,
  styles: [
    `
      .sidebar-nav {
        padding-top: 0.5rem;
      }

      a[mat-list-item] {
        margin: 0.25rem 0.5rem;
        border-radius: 8px;
        transition: all 0.2s ease-in-out;
        color: #666;

        &:hover {
          background-color: #f5f5f5;
        }

        &.active {
          background-color: #e3f2fd;
          color: #1976d2;

          mat-icon {
            color: #1976d2;
          }
        }
      }

      mat-icon {
        color: #666;
        margin-right: 1rem;
      }

      span {
        font-size: 0.95rem;
        font-weight: 500;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit {
  private authService = inject(Auth);

  @Output() navItemClicked = new EventEmitter<void>();

  navItems = NAV_ITEMS;
  filteredNavItems: NavItem[] = [];
  isCollapsed = false;

  ngOnInit(): void {
    this.filterNavItems();
    this.authService.currentUser$.subscribe(() => {
      this.filterNavItems();
    });
  }

  private filterNavItems(): void {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.filteredNavItems = [];
      return;
    }

    // superadmin has access to all nav items
    if (currentUser.userType === 'superadmin') {
      this.filteredNavItems = this.navItems;
      return;
    }

    this.filteredNavItems = this.navItems.filter((item) => {
      if (!item.roles || item.roles.length === 0) {
        return true;
      }
      return item.roles.includes(currentUser.userType);
    });
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
