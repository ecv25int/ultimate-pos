import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { filter, Subject, takeUntil } from 'rxjs';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  template: `
    @if (breadcrumbs.length > 1) {
      <nav class="breadcrumb-nav" aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          @for (crumb of breadcrumbs; track crumb.url; let last = $last) {
            <li class="breadcrumb-item" [class.active]="last">
              @if (!last) {
                <a [routerLink]="crumb.url" class="breadcrumb-link">{{ crumb.label }}</a>
                <mat-icon class="breadcrumb-sep">chevron_right</mat-icon>
              } @else {
                <span class="breadcrumb-current">{{ crumb.label }}</span>
              }
            </li>
          }
        </ol>
      </nav>
    }
  `,
  styles: [`
    .breadcrumb-nav {
      padding: 8px 24px 0;
      background: transparent;
    }

    .breadcrumb-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 2px;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      font-size: 13px;
    }

    .breadcrumb-link {
      color: #6b7280;
      text-decoration: none;
      transition: color 0.15s;
    }

    .breadcrumb-link:hover {
      color: #4f46e5;
    }

    .breadcrumb-sep {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #d1d5db;
      margin: 0 2px;
    }

    .breadcrumb-current {
      color: #111827;
      font-weight: 500;
    }
  `],
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  breadcrumbs: Breadcrumb[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.activatedRoute.root);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    crumbs: Breadcrumb[] = [],
  ): Breadcrumb[] {
    const children = route.children;

    if (children.length === 0) {
      return crumbs;
    }

    for (const child of children) {
      const routeURL = child.snapshot.url
        .map((seg) => seg.path)
        .join('/');

      const nextUrl = routeURL ? `${url}/${routeURL}` : url;

      // Use route title (strip " - Ultimate POS" suffix for display)
      const title =
        child.snapshot.title ||
        child.snapshot.data['title'] ||
        child.snapshot.data['breadcrumb'];

      if (title) {
        const label = String(title)
          .replace(/\s*-\s*Ultimate POS\s*$/i, '')
          .trim();

        if (label && label.toLowerCase() !== 'dashboard') {
          crumbs = [...crumbs, { label, url: nextUrl }];
        }
      }

      return this.buildBreadcrumbs(child, nextUrl, crumbs);
    }

    return crumbs;
  }
}
