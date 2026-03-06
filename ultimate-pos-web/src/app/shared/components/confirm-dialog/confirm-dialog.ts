import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** 'warn' shows red confirm button (default for deletes), 'primary' shows blue */
  confirmColor?: 'warn' | 'primary';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="title-icon" [class.warn]="data.confirmColor !== 'primary'">
          {{ data.confirmColor === 'primary' ? 'help_outline' : 'warning_amber' }}
        </mat-icon>
        {{ data.title }}
      </h2>
      <mat-dialog-content>
        <p class="message">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="cancel()">
          {{ data.cancelText ?? 'Cancel' }}
        </button>
        <button
          mat-raised-button
          [color]="data.confirmColor ?? 'warn'"
          (click)="confirm()"
        >
          {{ data.confirmText ?? 'Delete' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirm-dialog { padding: 8px 16px 0; min-width: 360px; }
    .dialog-title { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; }
    .title-icon { font-size: 22px; height: 22px; width: 22px; }
    .title-icon.warn { color: #f44336; }
    .message { color: rgba(0,0,0,.7); margin: 0; line-height: 1.5; }
    mat-dialog-actions { padding: 16px 0 8px; gap: 8px; }
  `],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}

  confirm(): void { this.dialogRef.close(true); }
  cancel(): void  { this.dialogRef.close(false); }
}
