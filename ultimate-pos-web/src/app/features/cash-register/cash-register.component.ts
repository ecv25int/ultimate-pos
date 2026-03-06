import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CashRegisterService } from '../../core/services/cash-register.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import {
  AddTransactionDto,
  CashRegister,
  CashRegisterSummary,
} from '../../core/models/cash-register.model';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1>Cash Register</h1>
          <p>Manage cash register sessions</p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="stats-grid" *ngIf="summary">
        <div class="stat-card" [class.success]="summary.openSessions > 0">
          <span class="label">Open Sessions</span>
          <span class="value">{{ summary.openSessions }}</span>
        </div>
        <div class="stat-card">
          <span class="label">Total Float</span>
          <span class="value">{{ summary.totalOpenFloat | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card success">
          <span class="label">Cash In</span>
          <span class="value">{{ summary.totalCashIn | number:'1.2-2' }}</span>
        </div>
        <div class="stat-card warning">
          <span class="label">Cash Out</span>
          <span class="value">{{ summary.totalCashOut | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Active Session -->
      <div class="section-card" *ngIf="activeSession; else noSession">
        <div class="section-header">
          <h2>Active Session #{{ activeSession.id }}</h2>
          <span class="badge success">OPEN</span>
        </div>
        <p>Opened: {{ activeSession.openedAt | date:'medium' }}</p>
        <p>Opening Amount: <strong>{{ activeSession.openingAmount | number:'1.2-2' }}</strong></p>

        <!-- Transactions -->
        <h3>Transactions</h3>
        <table class="data-table" *ngIf="activeSession.transactions.length > 0">
          <thead>
            <tr>
              <th>Type</th>
              <th class="text-right">Amount</th>
              <th>Note</th>
              <th>Ref</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of activeSession.transactions">
              <td>
                <span class="badge" [ngClass]="txnClass(t.transactionType)">{{ t.transactionType }}</span>
              </td>
              <td class="text-right">{{ t.amount | number:'1.2-2' }}</td>
              <td>{{ t.note || '—' }}</td>
              <td>{{ t.referenceNo || '—' }}</td>
              <td>{{ t.createdAt | date:'shortTime' }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Add Transaction -->
        <div class="form-row" style="margin-top:16px">
          <h3>Add Transaction</h3>
          <div class="form-row">
            <select [(ngModel)]="txnForm.transactionType" name="txnType" class="form-control">
              <option value="cash_in">Cash In</option>
              <option value="cash_out">Cash Out</option>
            </select>
            <input
              type="number"
              [(ngModel)]="txnForm.amount"
              name="txnAmount"
              placeholder="Amount"
              min="0"
              step="0.01"
              class="form-control"
            />
            <input
              type="text"
              [(ngModel)]="txnForm.note"
              name="txnNote"
              placeholder="Note (optional)"
              class="form-control"
            />
            <button class="btn btn-primary" (click)="addTransaction()" [disabled]="savingTxn">
              {{ savingTxn ? 'Adding...' : 'Add' }}
            </button>
          </div>
        </div>

        <!-- Close Register -->
        <div style="margin-top:24px; border-top: 1px solid #eee; padding-top:16px">
          <h3>Close Register</h3>
          <div class="form-row">
            <input
              type="number"
              [(ngModel)]="closeAmount"
              name="closeAmount"
              placeholder="Closing Amount"
              min="0"
              step="0.01"
              class="form-control"
            />
            <input
              type="text"
              [(ngModel)]="closeNote"
              name="closeNote"
              placeholder="Closing Note (optional)"
              class="form-control"
            />
            <button class="btn btn-danger" (click)="closeRegister()" [disabled]="closing">
              {{ closing ? 'Closing...' : 'Close Register' }}
            </button>
          </div>
        </div>
      </div>

      <!-- No active session -->
      <ng-template #noSession>
        <div class="section-card" *ngIf="!opening">
          <div class="empty-state">
            <p>No active cash register session.</p>
            <button class="btn btn-primary" (click)="showOpenForm = true" *ngIf="!showOpenForm">
              Open New Session
            </button>
            <div *ngIf="showOpenForm" class="form-row" style="margin-top:16px">
              <input
                type="number"
                [(ngModel)]="openAmount"
                name="openAmount"
                placeholder="Opening Amount"
                min="0"
                step="0.01"
                class="form-control"
              />
              <input
                type="text"
                [(ngModel)]="openNote"
                name="openNote"
                placeholder="Opening Note (optional)"
                class="form-control"
              />
              <button class="btn btn-primary" (click)="openRegister()">Open</button>
              <button class="btn btn-secondary" (click)="showOpenForm = false">Cancel</button>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- Session History -->
      <div class="section-card" style="margin-top:24px">
        <h2>Session History</h2>
        <table class="data-table" *ngIf="sessions.length > 0; else noHistory">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Opened</th>
              <th>Closed</th>
              <th class="text-right">Opening</th>
              <th class="text-right">Closing</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of sessions">
              <td>#{{ s.id }}</td>
              <td><span class="badge" [ngClass]="s.status === 'open' ? 'success' : 'neutral'">{{ s.status }}</span></td>
              <td>{{ s.openedAt | date:'medium' }}</td>
              <td>{{ s.closedAt ? (s.closedAt | date:'medium') : '—' }}</td>
              <td class="text-right">{{ s.openingAmount | number:'1.2-2' }}</td>
              <td class="text-right">{{ s.closingAmount != null ? (s.closingAmount | number:'1.2-2') : '—' }}</td>
            </tr>
          </tbody>
        </table>
        <ng-template #noHistory>
          <div class="empty-state">No sessions yet.</div>
        </ng-template>
      </div>
    </div>
  `,
})
export class CashRegisterComponent implements OnInit {
  summary: CashRegisterSummary | null = null;
  activeSession: CashRegister | null = null;
  sessions: CashRegister[] = [];

  // Open form
  showOpenForm = false;
  opening = false;
  openAmount = 0;
  openNote = '';

  // Transaction form
  txnForm: AddTransactionDto = { transactionType: 'cash_in', amount: 0 };
  savingTxn = false;

  // Close form
  closeAmount = 0;
  closeNote = '';
  closing = false;

  constructor(private cashRegisterService: CashRegisterService, private dialog: MatDialog) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.cashRegisterService
      .getSummary()
      .subscribe((s) => (this.summary = s));
    this.cashRegisterService.getActiveSession().subscribe((s) => {
      this.activeSession = s;
      if (s) this.closeAmount = s.openingAmount;
    });
    this.cashRegisterService
      .getAll()
      .subscribe((res) => (this.sessions = res.data));
  }

  openRegister() {
    if (!this.openAmount && this.openAmount !== 0) return;
    this.opening = true;
    this.cashRegisterService
      .openRegister({ openingAmount: this.openAmount, openNote: this.openNote || undefined })
      .subscribe({
        next: () => {
          this.showOpenForm = false;
          this.openAmount = 0;
          this.openNote = '';
          this.opening = false;
          this.loadAll();
        },
        error: () => (this.opening = false),
      });
  }

  addTransaction() {
    if (!this.activeSession || !this.txnForm.amount) return;
    this.savingTxn = true;
    this.cashRegisterService
      .addTransaction(this.activeSession.id, this.txnForm)
      .subscribe({
        next: () => {
          this.txnForm = { transactionType: 'cash_in', amount: 0 };
          this.savingTxn = false;
          this.loadAll();
        },
        error: () => (this.savingTxn = false),
      });
  }

  closeRegister() {
    if (!this.activeSession) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Close Register', message: 'Close this cash register session?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.closing = true;
      this.cashRegisterService
        .closeRegister(this.activeSession!.id, {
          closingAmount: this.closeAmount,
          closingNote: this.closeNote || undefined,
        })
        .subscribe({
          next: () => {
            this.activeSession = null;
            this.closing = false;
            this.loadAll();
          },
          error: () => (this.closing = false),
        });
    });
  }

  txnClass(type: string): string {
    const map: Record<string, string> = {
      cash_in: 'success',
      cash_out: 'warning',
      sale: 'info',
      refund: 'danger',
      opening: 'neutral',
      closing: 'neutral',
    };
    return map[type] ?? 'neutral';
  }
}
