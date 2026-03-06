import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog';
import { EmptyStateComponent } from './components/empty-state/empty-state';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';

@NgModule({
  declarations: [],
  imports: [CommonModule, ConfirmDialogComponent, EmptyStateComponent, SkeletonLoaderComponent, BreadcrumbComponent],
  exports: [ConfirmDialogComponent, EmptyStateComponent, SkeletonLoaderComponent, BreadcrumbComponent],
})
export class SharedModule {}

// Re-export standalone components for direct import in standalone components
export { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog';
export { EmptyStateComponent } from './components/empty-state/empty-state';
export { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';
export { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';

