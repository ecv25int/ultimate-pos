import { Component, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { BreadcrumbComponent } from '../../../shared/components/breadcrumb/breadcrumb.component';
import { SessionTimeoutService } from '../../services/session-timeout.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSidenavModule,
    HeaderComponent,
    SidebarComponent,
    BreadcrumbComponent,
  ],
  template: `
    <div class="app-container">
      <app-header></app-header>

      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav
          #sidenav
          [mode]="sidenavMode"
          [opened]="sidenavOpened"
          class="app-sidenav"
        >
          <app-sidebar (navItemClicked)="onNavItemClick()"></app-sidebar>
        </mat-sidenav>

        <mat-sidenav-content class="main-content">
          <div class="content-wrapper">
            <app-breadcrumb></app-breadcrumb>
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [
    `
      .app-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
        overflow: hidden;
      }

      .sidenav-container {
        flex: 1;
        margin-top: 64px;
      }

      .app-sidenav {
        width: 250px;
        border-right: 1px solid #e0e0e0;
        background-color: #fff;
      }

      .main-content {
        background-color: #f5f5f5;
      }

      .content-wrapper {
        padding: 1.5rem;
        min-height: calc(100vh - 64px);
      }

      @media (max-width: 768px) {
        .app-sidenav {
          width: 220px;
        }

        .content-wrapper {
          padding: 1rem;
        }
      }
    `,
  ],
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  private sessionTimeout = inject(SessionTimeoutService);
  private breakpointObserver = inject(BreakpointObserver);
  private subs = new Subscription();

  sidenavMode: 'side' | 'over' = 'side';
  sidenavOpened = true;
  isMobile = false;

  constructor() {
    this.subs.add(
      this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.TabletPortrait])
        .subscribe(result => {
          this.isMobile = result.matches;
          this.sidenavMode = result.matches ? 'over' : 'side';
          this.sidenavOpened = !result.matches;
        }),
    );
    this.subs.add(
      new Subscription(() =>
        window.removeEventListener('toggleSidebar', this._toggleHandler),
      ),
    );
    window.addEventListener('toggleSidebar', this._toggleHandler);
  }

  private _toggleHandler = () => this.toggleSidebar();

  ngOnInit(): void {
    this.sessionTimeout.start();
  }

  ngOnDestroy(): void {
    this.sessionTimeout.stop();
    this.subs.unsubscribe();
  }

  /** Called by sidebar nav items on mobile to close the drawer after navigation. */
  onNavItemClick(): void {
    if (this.isMobile) {
      this.sidenav?.close();
    }
  }

  toggleSidebar(): void {
    this.sidenav?.toggle();
  }
}
