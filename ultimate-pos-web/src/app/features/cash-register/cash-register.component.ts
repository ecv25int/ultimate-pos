import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CashRegisterService } from '../../core/services/cash-register.service';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { SkeletonLoaderComponent } from '../../shared/components/skeleton-loader/skeleton-loader.component';
import {
  AddTransactionDto,
  CashRegister,
  CashRegisterSummary,
} from '../../core/models/cash-register.model';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    SkeletonLoaderComponent,
  ],
  template: `
    <div class="cash-register-container">

      <!-- Header -->
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">point_of_sale</mat-icon>
          <div>
            <h1>Cash Register</h1>
            <p class="subtitle">Manage cash register sessions</p>
          </div>
        </div>
        @if (!activeSession) {
          <button mat-raised-button color="primary" (click)="showOpenForm = true">
            <mat-icon>play_circle</mat-icon>
            Open Session
          </button>
        }
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon" [class.green]="summary && summary.openSessions > 0" [class.grey]="!summary || summary.openSessions === 0">radio_button_checked</mat-icon>
              <div>
                <div class="stat-number">{{ summary?.openSessions ?? 0 }}</div>
                <div class="stat-label">Open Sessions</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon blue">account_balance_wallet</mat-icon>
              <div>
                <div class="stat-number">{{ summary?.totalOpenFloat ?? 0 | number:'1.2-2' }}</div>
                <div class="stat-label">Total Float</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon green">add_circle</mat-icon>
              <div>
                <div class="stat-number">{{ summary?.totalCashIn ?? 0 | number:'1.2-2' }}</div>
                <div class="stat-label">Cash In</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon orange">remove_circle</mat-icon>
              <div>
                <div class="stat-number">{{ summary?.totalCashOut ?? 0 | number:'1.2-2' }}</div>
                <div class="stat-label">Cash Out</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Open Session Form (no active session) -->
      @if (!activeSession && showOpenForm) {
        <mat-card class="section-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>play_circle</mat-icon>
            <mat-card-title>Open New Session</mat-card-title>
            <mat-card-subtitle>Enter the opening float amount to start a new session</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="open-form-row">
              <mat-form-field appearance="outline">
                <mat-label>Opening Amount</mat-label>
                <mat-icon matPrefix>attach_money</mat-icon>
                <input matInput type="number" [(ngModel)]="openAmount" min="0" step="0.01" placeholder="0.00" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="note-field">
                <mat-label>Opening Note (optional)</mat-label>
                <mat-icon matPrefix>notes</mat-icon>
                <input matInput type="text" [(ngModel)]="openNote" placeholder="e.g. Morning shift" />
              </mat-form-field>
            </div>
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-button (click)="showOpenForm = false">Cancel</button>
            <button mat-raised-button color="primary" (click)="openRegister()" [disabled]="opening">
              @if (opening) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
              @else { <mat-icon>play_circle</mat-icon> }
              {{ opening ? 'Opening…' : 'Open Register' }}
            </button>
          </mat-card-actions>
        </mat-card>
      }

      <!-- No Active Session placeholder -->
      @if (!activeSession && !showOpenForm) {
        <mat-card class="section-card empty-session-card">
          <mat-card-content>
            <div class="empty-state">
              <mat-icon class="empty-icon">point_of_sale</mat-icon>
              <h3>No Active Session</h3>
              <p>Open a new cash register session to start recording transactions.</p>
              <button mat-raised-button color="primary" (click)="showOpenForm = true">
                <mat-icon>play_circle</mat-icon>
                Open New Session
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Active Session -->
      @if (activeSession) {
        <mat-card class="section-card active-session-card">
          <mat-card-header>
            <mat-icon mat-card-avatar class="session-avatar">radio_button_checked</mat-icon>
            <mat-card-title>
              Active Session &nbsp;
              <mat-chip class="status-chip open">OPEN</mat-chip>
            </mat-card-title>
            <mat-card-subtitle>
              Session #{{ activeSession.id }} &nbsp;·&nbsp; Opened {{ activeSession.openedAt | date:'medium' }}
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Session summary row -->
            <div class="session-meta">
              <div class="meta-item">
                <mat-icon>attach_money</mat-icon>
                <span>Opening float: <strong>{{ activeSession.openingAmount | number:'1.2-2' }}</strong></span>
              </div>
              @if (activeSession.openNote) {
                <div class="meta-item">
                  <mat-icon>notes</mat-icon>
                  <span>{{ activeSession.openNote }}</span>
                </div>
              }
            </div>

            <mat-divider style="margin: 1rem 0"></mat-divider>

            <!-- Transactions table -->
            <h3 class="section-title">
              <mat-icon>receipt</mat-icon>
              Transactions
              <span class="count-badge">{{ activeSession.transactions.length }}</span>
            </h3>

            @if (activeSession.transactions.length === 0) {
              <div class="no-txn">
                <mat-icon>receipt_long</mat-icon>
                <span>No transactions yet in this session</span>
              </div>
            } @else {
              <table mat-table [dataSource]="activeSession.transactions" class="txn-table">
                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let t">
                    <mat-chip [class]="'txn-chip ' + txnClass(t.transactionType)">
                      <mat-icon class="chip-icon">{{ txnIcon(t.transactionType) }}</mat-icon>
                      {{ t.transactionType | titlecase }}
                    </mat-chip>
                  </td>
                </ng-container>
                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef class="text-right">Amount</th>
                  <td mat-cell *matCellDef="let t" class="text-right amount-cell" [class.cash-in]="t.transactionType === 'cash_in' || t.transactionType === 'sale'" [class.cash-out]="t.transactionType === 'cash_out' || t.transactionType === 'refund'">
                    {{ t.amount | number:'1.2-2' }}
                  </td>
                </ng-container>
                <ng-container matColumnDef="note">
                  <th mat-header-cell *matHeaderCellDef>Note</th>
                  <td mat-cell *matCellDef="let t">{{ t.note || '—' }}</td>
                </ng-container>
                <ng-container matColumnDef="ref">
                  <th mat-header-cell *matHeaderCellDef>Ref</th>
                  <td mat-cell *matCellDef="let t">
                    @if (t.referenceNo) {
                      <span class="ref-badge">{{ t.referenceNo }}</span>
                    } @else { <span class="muted">—</span> }
                  </td>
                </ng-container>
                <ng-container matColumnDef="time">
                  <th mat-header-cell *matHeaderCellDef>Time</th>
                  <td mat-cell *matCellDef="let t" class="muted">{{ t.createdAt | date:'shortTime' }}</td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="txnColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: txnColumns;" class="txn-row"></tr>
              </table>
            }

            <mat-divider style="margin: 1.5rem 0"></mat-divider>

            <!-- Add Transaction -->
            <h3 class="section-title">
              <mat-icon>add_circle_outline</mat-icon>
              Add Transaction
            </h3>
            <div class="txn-form-row">
              <mat-form-field appearance="outline">
                <mat-label>Type</mat-label>
                <mat-select [(ngModel)]="txnForm.transactionType">
                  <mat-option value="cash_in">
                    <mat-icon>add_circle</mat-icon> Cash In
                  </mat-option>
                  <mat-option value="cash_out">
                    <mat-icon>remove_circle</mat-icon> Cash Out
                  </mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Amount</mat-label>
                <mat-icon matPrefix>attach_money</mat-icon>
                <input matInput type="number" [(ngModel)]="txnForm.amount" min="0" step="0.01" placeholder="0.00" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="note-field">
                <mat-label>Note (optional)</mat-label>
                <input matInput type="text" [(ngModel)]="txnForm.note" placeholder="Reason…" />
              </mat-form-field>
              <button mat-raised-button color="accent" (click)="addTransaction()" [disabled]="savingTxn || !txnForm.amount">
                @if (savingTxn) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
                @else { <mat-icon>add</mat-icon> }
                {{ savingTxn ? 'Adding…' : 'Add' }}
              </button>
            </div>

            <mat-divider style="margin: 1.5rem 0"></mat-divider>

            <!-- Close Register -->
            <h3 class="section-title close-title">
              <mat-icon>stop_circle</mat-icon>
              Close Register
            </h3>
            <div class="txn-form-row">
              <mat-form-field appearance="outline">
                <mat-label>Closing Amount</mat-label>
                <mat-icon matPrefix>attach_money</mat-icon>
                <input matInput type="number" [(ngModel)]="closeAmount" min="0" step="0.01" placeholder="0.00" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="note-field">
                <mat-label>Closing Note (optional)</mat-label>
                <input matInput type="text" [(ngModel)]="closeNote" placeholder="End of shift…" />
              </mat-form-field>
              <button mat-raised-button color="warn" (click)="closeRegister()" [disabled]="closing">
                @if (closing) { <mat-spinner diameter="18" style="display:inline-block"></mat-spinner> }
                @else { <mat-icon>stop_circle</mat-icon> }
                {{ closing ? 'Closing…' : 'Close Register' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Session History -->
      <mat-card class="section-card">
        <mat-card-header>
          <mat-icon mat-card-avatar>history</mat-icon>
          <mat-card-title>Session History</mat-card-title>
          <mat-card-subtitle>All past cash register sessions</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          @if (loadingHistory) {
            <app-skeleton-loader [rows]="5" type="table"></app-skeleton-loader>
          } @else if (sessions.length === 0) {
            <div class="empty-state small">
              <mat-icon class="empty-icon small-icon">history</mat-icon>
              <p>No sessions recorded yet.</p>
            </div>
          } @else {
            <table mat-table [dataSource]="sessions" class="history-table">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>Session</th>
                <td mat-cell *matCellDef="let s">
                  <span class="ref-badge">#{{ s.id }}</span>
                </td>
              </ng-container>
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let s">
                  <mat-chip [class]="'status-chip ' + s.status">{{ s.status | titlecase }}</mat-chip>
                </td>
              </ng-container>
              <ng-container matColumnDef="opened">
                <th mat-header-cell *matHeaderCellDef>Opened</th>
                <td mat-cell *matCellDef="let s">{{ s.openedAt | date:'medium' }}</td>
              </ng-container>
              <ng-container matColumnDef="closed">
                <th mat-header-cell *matHeaderCellDef>Closed</th>
                <td mat-cell *matCellDef="let s" class="muted">
                  {{ s.closedAt ? (s.closedAt | date:'medium') : '—' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="opening">
                <th mat-header-cell *matHeaderCellDef class="text-right">Opening</th>
                <td mat-cell *matCellDef="let s" class="text-right">{{ s.openingAmount | number:'1.2-2' }}</td>
              </ng-container>
              <ng-container matColumnDef="closing">
                <th mat-header-cell *matHeaderCellDef class="text-right">Closing</th>
                <td mat-cell *matCellDef="let s" class="text-right">
                  @if (s.closingAmount != null) {
                    <strong>{{ s.closingAmount | number:'1.2-2' }}</strong>
                  } @else { <span class="muted">—</span> }
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="historyColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: historyColumns;" class="history-row"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>

    </div>
  `,
  styles: [`
    .cash-register-container {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* ── Header ── */
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .header-title {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #1976d2;
    }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #666; font-size: 0.9rem; }

    /* ── Stats ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card { border-radius: 12px; }
    .stat-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem 0;
    }
    .stat-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 10px;
      padding: 0.5rem;
      &.blue   { color: #1976d2; background: #e3f2fd; }
      &.green  { color: #388e3c; background: #e8f5e9; }
      &.orange { color: #f57c00; background: #fff3e0; }
      &.grey   { color: #9e9e9e; background: #f5f5f5; }
    }
    .stat-number { font-size: 1.75rem; font-weight: 700; line-height: 1; color: #1a1a1a; }
    .stat-label  { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }

    /* ── Cards ── */
    .section-card {
      border-radius: 12px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .active-session-card {
      border-top: 3px solid #4caf50;
    }
    .empty-session-card mat-card-content { padding: 0; }
    .session-avatar { color: #4caf50 !important; }

    /* ── Session meta ── */
    .session-meta {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #555;
      font-size: 0.9rem;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #9e9e9e; }
    }

    /* ── Section titles ── */
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #333;
      margin: 0 0 1rem 0;
      mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; color: #1976d2; }
    }
    .close-title mat-icon { color: #f44336; }
    .count-badge {
      background: #e3f2fd;
      color: #1976d2;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    /* ── Chips ── */
    .status-chip {
      font-size: 0.75rem;
      padding: 0 8px;
      &.open   { background: #e8f5e9; color: #388e3c; }
      &.closed { background: #f5f5f5; color: #9e9e9e; }
    }
    .txn-chip {
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 4px;
      &.cash-in  { background: #e8f5e9; color: #388e3c; }
      &.cash-out { background: #fff3e0; color: #f57c00; }
      &.sale     { background: #e3f2fd; color: #1976d2; }
      &.refund   { background: #fce4ec; color: #c62828; }
      &.opening  { background: #f3e5f5; color: #7b1fa2; }
      &.closing  { background: #f5f5f5; color: #616161; }
    }
    .chip-icon { font-size: 0.9rem !important; width: 0.9rem !important; height: 0.9rem !important; }

    /* ── Tables ── */
    .txn-table, .history-table { width: 100%; }
    .text-right { text-align: right !important; }
    .amount-cell { font-weight: 500; }
    .cash-in  { color: #388e3c; }
    .cash-out { color: #f57c00; }
    .muted    { color: #9e9e9e; }
    .ref-badge {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 2px 8px;
      font-family: monospace;
      font-size: 0.85rem;
      color: #333;
    }
    .txn-row, .history-row {
      transition: background-color 0.15s ease;
      &:hover { background: #f5f5f5; }
    }
    .no-txn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #9e9e9e;
      padding: 1rem 0.5rem;
      font-size: 0.9rem;
      mat-icon { font-size: 1.2rem; width: 1.2rem; height: 1.2rem; }
    }

    /* ── Forms ── */
    .open-form-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.5rem;
    }
    .txn-form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    .note-field { flex: 1; min-width: 180px; }

    /* ── Empty states ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 2rem;
      text-align: center;
      color: #666;
      &.small { padding: 2rem 1rem; }
    }
    .empty-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #bdbdbd;
      margin-bottom: 1rem;
      &.small-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; }
    }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .txn-form-row, .open-form-row { flex-direction: column; }
    }
  `],
})
export class CashRegisterComponent implements OnInit {
  summary: CashRegisterSummary | null = null;
  activeSession: CashRegister | null = null;
  sessions: CashRegister[] = [];
  loadingHistory = true;

  showOpenForm = false;
  opening = false;
  openAmount = 0;
  openNote = '';

  txnForm: AddTransactionDto = { transactionType: 'cash_in', amount: 0 };
  savingTxn = false;

  closeAmount = 0;
  closeNote = '';
  closing = false;

  txnColumns = ['type', 'amount', 'note', 'ref', 'time'];
  historyColumns = ['id', 'status', 'opened', 'closed', 'opening', 'closing'];

  constructor(
    private cashRegisterService: CashRegisterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.cashRegisterService.getSummary().subscribe((s) => {
      this.summary = s;
      this.cdr.markForCheck();
    });
    this.cashRegisterService.getActiveSession().subscribe((s) => {
      this.activeSession = s;
      if (s) this.closeAmount = s.openingAmount;
      this.cdr.markForCheck();
    });
    this.loadingHistory = true;
    this.cashRegisterService.getAll().subscribe({
      next: (res) => {
        this.sessions = res.data;
        this.loadingHistory = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loadingHistory = false;
        this.cdr.markForCheck();
      },
    });
  }

  openRegister() {
    this.opening = true;
    this.cashRegisterService
      .openRegister({ openingAmount: this.openAmount, openNote: this.openNote || undefined })
      .subscribe({
        next: () => {
          this.showOpenForm = false;
          this.openAmount = 0;
          this.openNote = '';
          this.opening = false;
          this.snackBar.open('Cash register opened', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
          this.loadAll();
        },
        error: () => {
          this.opening = false;
          this.cdr.markForCheck();
          this.snackBar.open('Failed to open register', 'Close', { duration: 4000 });
        },
      });
  }

  addTransaction() {
    if (!this.activeSession || !this.txnForm.amount) return;
    this.savingTxn = true;
    this.cashRegisterService.addTransaction(this.activeSession.id, this.txnForm).subscribe({
      next: () => {
        this.txnForm = { transactionType: 'cash_in', amount: 0 };
        this.savingTxn = false;
        this.snackBar.open('Transaction added', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
        this.loadAll();
      },
      error: () => {
        this.savingTxn = false;
        this.cdr.markForCheck();
        this.snackBar.open('Failed to add transaction', 'Close', { duration: 4000 });
      },
    });
  }

  closeRegister() {
    if (!this.activeSession) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Close Register', message: 'Are you sure you want to close this session?', confirmColor: 'warn' },
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
            this.snackBar.open('Register closed', 'Close', { duration: 3000, panelClass: ['success-snackbar'] });
            this.loadAll();
          },
          error: () => {
            this.closing = false;
            this.cdr.markForCheck();
            this.snackBar.open('Failed to close register', 'Close', { duration: 4000 });
          },
        });
    });
  }

  txnClass(type: string): string {
    const map: Record<string, string> = {
      cash_in: 'cash-in',
      cash_out: 'cash-out',
      sale: 'sale',
      refund: 'refund',
      opening: 'opening',
      closing: 'closing',
    };
    return map[type] ?? 'opening';
  }

  txnIcon(type: string): string {
    const map: Record<string, string> = {
      cash_in: 'add_circle',
      cash_out: 'remove_circle',
      sale: 'shopping_cart',
      refund: 'undo',
      opening: 'play_circle',
      closing: 'stop_circle',
    };
    return map[type] ?? 'swap_horiz';
  }
}
