import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { PaymentsService } from '../../core/services/payments.service';
import { Payment, PAYMENT_METHODS, CreatePaymentDto } from '../../core/models/payment.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDividerModule,
    MatChipsModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">payments</mat-icon>
          <div>
            <h1>Payments</h1>
            <p class="subtitle">Record and track payment transactions</p>
          </div>
        </div>
      </div>

      <div class="two-column-layout">
        <!-- Add Payment Form -->
        <mat-card class="form-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>add_circle</mat-icon>
            <mat-card-title>Record Payment</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="save()">

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Linked To</mat-label>
                <mat-select formControlName="linkedType">
                  <mat-option value="sale">Sale</mat-option>
                  <mat-option value="purchase">Purchase</mat-option>
                  <mat-option value="none">No Link</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width"
                *ngIf="form.get('linkedType')?.value === 'sale'">
                <mat-label>Sale ID</mat-label>
                <input matInput type="number" formControlName="saleId" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width"
                *ngIf="form.get('linkedType')?.value === 'purchase'">
                <mat-label>Purchase ID</mat-label>
                <input matInput type="number" formControlName="purchaseId" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Amount *</mat-label>
                <input matInput type="number" formControlName="amount" min="0.01" step="0.01" />
                <mat-error *ngIf="form.get('amount')?.invalid && form.get('amount')?.touched">
                  Enter a valid amount
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="method">
                  <mat-option *ngFor="let m of methods" [value]="m.value">{{ m.label }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Payment Date</mat-label>
                <input matInput type="date" formControlName="paymentDate" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Reference No</mat-label>
                <input matInput formControlName="referenceNo" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Note</mat-label>
                <textarea matInput formControlName="note" rows="2"></textarea>
              </mat-form-field>

              <div class="form-actions">
                <button mat-button type="button" (click)="resetForm()">Clear</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="saving">
                  <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
                  <span *ngIf="!saving">Save Payment</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Payment List -->
        <mat-card class="list-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>receipt_long</mat-icon>
            <mat-card-title>All Payments</mat-card-title>
            <mat-card-subtitle>{{ total }} total</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div *ngIf="loading" class="loading-container">
              <mat-spinner diameter="40"></mat-spinner>
            </div>

            <table mat-table [dataSource]="payments" *ngIf="!loading">

              <ng-container matColumnDef="linked">
                <th mat-header-cell *matHeaderCellDef>Linked To</th>
                <td mat-cell *matCellDef="let row">
                  <span *ngIf="row.sale">Sale #{{ row.saleId }}</span>
                  <span *ngIf="row.purchase">Purchase #{{ row.purchaseId }}</span>
                  <span *ngIf="!row.sale && !row.purchase">—</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let row">{{ row.amount | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="method">
                <th mat-header-cell *matHeaderCellDef>Method</th>
                <td mat-cell *matCellDef="let row">
                  <span class="badge badge-method">{{ row.method }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.paymentDate | date:'shortDate' }}</td>
              </ng-container>

              <ng-container matColumnDef="note">
                <th mat-header-cell *matHeaderCellDef>Note</th>
                <td mat-cell *matCellDef="let row">{{ row.note ?? '—' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button color="warn" matTooltip="Delete"
                    (click)="deletePayment(row)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns;"></tr>
            </table>

            <mat-paginator
              [length]="total"
              [pageSize]="10"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPage($event)">
            </mat-paginator>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .header-left { display: flex; align-items: center; gap: 16px; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .two-column-layout { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: start; }
    .full-width { width: 100%; margin-bottom: 8px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; }
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    table { width: 100%; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.78rem; font-weight: 500; }
    .badge-method { background: #e3f2fd; color: #1565c0; text-transform: capitalize; }
    @media (max-width: 900px) { .two-column-layout { grid-template-columns: 1fr; } }
  `],
})
export class PaymentsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private paymentsService = inject(PaymentsService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  form!: FormGroup;
  saving = false;
  loading = false;

  methods = PAYMENT_METHODS;
  payments: Payment[] = [];
  total = 0;
  page = 1;
  columns = ['linked', 'amount', 'method', 'date', 'note', 'actions'];

  ngOnInit() {
    const today = new Date().toISOString().split('T')[0];
    this.form = this.fb.group({
      linkedType: ['none'],
      saleId: [null],
      purchaseId: [null],
      amount: [null, [Validators.required, Validators.min(0.01)]],
      method: ['cash'],
      paymentDate: [today],
      referenceNo: [''],
      note: [''],
    });
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.paymentsService.getAll({ page: this.page, limit: 10 }).subscribe({
      next: (res) => {
        this.payments = res.data;
        this.total = res.total;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  onPage(e: PageEvent) {
    this.page = e.pageIndex + 1;
    this.loadPayments();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    const dto: CreatePaymentDto = {
      amount: val.amount,
      method: val.method,
      paymentDate: val.paymentDate,
      referenceNo: val.referenceNo || undefined,
      note: val.note || undefined,
    };
    if (val.linkedType === 'sale' && val.saleId) dto.saleId = +val.saleId;
    if (val.linkedType === 'purchase' && val.purchaseId) dto.purchaseId = +val.purchaseId;

    this.paymentsService.create(dto).subscribe({
      next: () => {
        this.snackBar.open('Payment recorded.', 'OK', { duration: 3000 });
        this.resetForm();
        this.loadPayments();
        this.saving = false;
      },
      error: (err) => {
        this.snackBar.open(err?.error?.message ?? 'Error saving payment.', 'Close', { duration: 5000 });
        this.saving = false;
      },
    });
  }

  deletePayment(p: Payment) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Payment', message: 'Delete this payment? The linked sale/purchase totals will be recalculated.' },
      width: '450px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.paymentsService.remove(p.id).subscribe({
        next: () => {
          this.snackBar.open('Payment deleted.', 'OK', { duration: 3000 });
          this.loadPayments();
        },
        error: (err) => this.snackBar.open(err?.error?.message ?? 'Error', 'Close', { duration: 5000 }),
      });
    });
  }

  resetForm() {
    const today = new Date().toISOString().split('T')[0];
    this.form.reset({ linkedType: 'none', method: 'cash', paymentDate: today });
  }
}
