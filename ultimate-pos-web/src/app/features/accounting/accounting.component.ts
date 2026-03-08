import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatBadgeModule } from '@angular/material/badge';
import { FormsModule } from '@angular/forms';
import { AccountingService } from '../../core/services/accounting.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import {
  AccountType,
  Account,
  AccountTransaction,
  TrialBalance,
  ProfitLoss,
  BalanceSheet,
} from '../../core/models/accounting.model';

@Component({
  selector: 'app-accounting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DecimalPipe,
    DatePipe,
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
    MatDividerModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatBadgeModule,
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <mat-icon class="header-icon">account_balance</mat-icon>
          <div>
            <h1>Accounting</h1>
            <p class="subtitle">Chart of accounts, journal entries & financial reports</p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <mat-tab-group animationDuration="200ms" (selectedTabChange)="onTabChange($event.index)">

        <!-- ── TAB 1: CHART OF ACCOUNTS ── -->
        <mat-tab label="Chart of Accounts">
          <div class="tab-content two-column-layout">

            <!-- Account form -->
            <mat-card class="form-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>{{ editingAccount ? 'edit' : 'add_circle' }}</mat-icon></div>
                <mat-card-title>{{ editingAccount ? 'Edit Account' : 'New Account' }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="accountForm" (ngSubmit)="saveAccount()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Account Number *</mat-label>
                    <input matInput formControlName="accountNumber" placeholder="e.g. 1000" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Account Name *</mat-label>
                    <input matInput formControlName="name" placeholder="e.g. Cash in Hand" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Account Type *</mat-label>
                    <mat-select formControlName="accountTypeId">
                      @for (t of accountTypes; track t.id) {
                        <mat-option [value]="t.id">
                          {{ t.name }} ({{ t.rootType | titlecase }})
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Note</mat-label>
                    <textarea matInput formControlName="note" rows="2"></textarea>
                  </mat-form-field>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit"
                      [disabled]="accountForm.invalid || savingAccount">
                      @if (savingAccount) { <mat-spinner diameter="18" /> }
                      {{ editingAccount ? 'Update' : 'Create Account' }}
                    </button>
                    @if (editingAccount) {
                      <button mat-button type="button" (click)="cancelEditAccount()">Cancel</button>
                    }
                  </div>
                </form>

                <mat-divider style="margin:14px 0" />

                <!-- Add account type inline -->
                <h3 style="margin:8px 0 6px;font-size:14px;color:#666">Add Account Type</h3>
                <form [formGroup]="typeForm" (ngSubmit)="saveAccountType()" style="display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap">
                  <mat-form-field appearance="outline" style="flex:1;min-width:120px">
                    <mat-label>Name</mat-label>
                    <input matInput formControlName="name" placeholder="e.g. Fixed Assets" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" style="flex:0 0 130px">
                    <mat-label>Root Type</mat-label>
                    <mat-select formControlName="rootType">
                      @for (r of rootTypes; track r.value) {
                        <mat-option [value]="r.value">{{ r.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <button mat-mini-fab color="accent" type="submit"
                    [disabled]="typeForm.invalid || savingType"
                    style="margin-top:4px" matTooltip="Add type">
                    <mat-icon>add</mat-icon>
                  </button>
                </form>
              </mat-card-content>
            </mat-card>

            <!-- Accounts list -->
            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon purple"><mat-icon>list</mat-icon></div>
                <mat-card-title>Accounts ({{ accounts.length }})</mat-card-title>
                <div style="margin-left:auto">
                  <mat-form-field appearance="outline" style="width:180px">
                    <mat-label>Search</mat-label>
                    <input matInput [(ngModel)]="accountSearch" placeholder="Name or #" />
                    <mat-icon matSuffix>search</mat-icon>
                  </mat-form-field>
                </div>
              </mat-card-header>
              <mat-card-content>
                @if (loadingAccounts) {
                  <div style="text-align:center;padding:32px"><mat-spinner diameter="36"/></div>
                } @else {
                  <table mat-table [dataSource]="filteredAccounts" style="width:100%">
                    <ng-container matColumnDef="accountNumber">
                      <th mat-header-cell *matHeaderCellDef>#</th>
                      <td mat-cell *matCellDef="let a">{{ a.accountNumber }}</td>
                    </ng-container>
                    <ng-container matColumnDef="name">
                      <th mat-header-cell *matHeaderCellDef>Name</th>
                      <td mat-cell *matCellDef="let a">
                        {{ a.name }}
                        @if (a.isClosed) {
                          <mat-chip style="margin-left:4px;font-size:10px">Closed</mat-chip>
                        }
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Type</th>
                      <td mat-cell *matCellDef="let a">
                        <span class="type-chip" [class]="'root-' + (a.accountType?.rootType || '')">
                          {{ a.accountType?.name }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="balance">
                      <th mat-header-cell *matHeaderCellDef style="text-align:right">Balance</th>
                      <td mat-cell *matCellDef="let a" style="text-align:right">
                        @if (a.balance !== undefined) {
                          <span [class.positive]="a.balance >= 0" [class.negative]="a.balance < 0">
                            {{ a.balance | number:'1.2-2' }}
                          </span>
                        } @else { — }
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let a">
                        <button mat-icon-button (click)="editAccount(a)" matTooltip="Edit">
                          <mat-icon>edit</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="deleteAccount(a.id)" matTooltip="Delete">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="accountCols"></tr>
                    <tr mat-row *matRowDef="let row; columns: accountCols"></tr>
                  </table>
                  @if (filteredAccounts.length === 0) {
                    <p style="text-align:center;padding:24px;color:#888">No accounts. Create one to get started.</p>
                  }
                }
              </mat-card-content>
            </mat-card>

          </div>
        </mat-tab>

        <!-- ── TAB 2: JOURNAL ENTRIES ── -->
        <mat-tab label="Journal Entries">
          <div class="tab-content two-column-layout">

            <!-- Entry form -->
            <mat-card class="form-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>edit_note</mat-icon></div>
                <mat-card-title>New Journal Entry</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <form [formGroup]="txForm" (ngSubmit)="saveTransaction()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Account *</mat-label>
                    <mat-select formControlName="accountId">
                      @for (a of accounts; track a.id) {
                        <mat-option [value]="a.id">
                          {{ a.accountNumber }} – {{ a.name }}
                        </mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  <div style="display:flex;gap:8px">
                    <mat-form-field appearance="outline" style="flex:1">
                      <mat-label>Type *</mat-label>
                      <mat-select formControlName="type">
                        <mat-option value="debit">Debit (Dr)</mat-option>
                        <mat-option value="credit">Credit (Cr)</mat-option>
                      </mat-select>
                    </mat-form-field>

                    <mat-form-field appearance="outline" style="flex:1">
                      <mat-label>Category</mat-label>
                      <mat-select formControlName="subType">
                        <mat-option value="">— none —</mat-option>
                        @for (s of subTypes; track s.value) {
                          <mat-option [value]="s.value">{{ s.label }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                  </div>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Amount *</mat-label>
                    <input matInput type="number" min="0.01" step="0.01" formControlName="amount" />
                    <span matPrefix>$&nbsp;</span>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Date *</mat-label>
                    <input matInput type="date" formControlName="operationDate" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Reference No.</mat-label>
                    <input matInput formControlName="referenceNo" placeholder="INV-001" />
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Note</mat-label>
                    <textarea matInput formControlName="note" rows="2"></textarea>
                  </mat-form-field>

                  <div class="form-actions">
                    <button mat-raised-button color="primary" type="submit"
                      [disabled]="txForm.invalid || savingTx">
                      @if (savingTx) { <mat-spinner diameter="18" /> }
                      Post Entry
                    </button>
                  </div>
                </form>
              </mat-card-content>
            </mat-card>

            <!-- Transactions list -->
            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon orange"><mat-icon>receipt_long</mat-icon></div>
                <mat-card-title>Ledger Entries</mat-card-title>
                <div style="margin-left:auto;display:flex;gap:8px;align-items:center">
                  <mat-form-field appearance="outline" style="width:160px">
                    <mat-label>Account</mat-label>
                    <mat-select [(ngModel)]="txFilterAccountId" (ngModelChange)="loadTransactions()">
                      <mat-option [value]="null">All accounts</mat-option>
                      @for (a of accounts; track a.id) {
                        <mat-option [value]="a.id">{{ a.accountNumber }} – {{ a.name }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                  <button mat-icon-button (click)="loadTransactions()" matTooltip="Refresh">
                    <mat-icon>refresh</mat-icon>
                  </button>
                </div>
              </mat-card-header>
              <mat-card-content>
                @if (loadingTx) {
                  <div style="text-align:center;padding:32px"><mat-spinner diameter="36"/></div>
                } @else {
                  <table mat-table [dataSource]="transactions" style="width:100%">
                    <ng-container matColumnDef="date">
                      <th mat-header-cell *matHeaderCellDef>Date</th>
                      <td mat-cell *matCellDef="let t">{{ t.operationDate | date:'MMM d, y' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="account">
                      <th mat-header-cell *matHeaderCellDef>Account</th>
                      <td mat-cell *matCellDef="let t">{{ t.account?.name }}</td>
                    </ng-container>
                    <ng-container matColumnDef="type">
                      <th mat-header-cell *matHeaderCellDef>Dr / Cr</th>
                      <td mat-cell *matCellDef="let t">
                        <span [class.debit-chip]="t.type==='debit'" [class.credit-chip]="t.type==='credit'">
                          {{ t.type | uppercase }}
                        </span>
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="amount">
                      <th mat-header-cell *matHeaderCellDef style="text-align:right">Amount</th>
                      <td mat-cell *matCellDef="let t" style="text-align:right">
                        {{ +t.amount | number:'1.2-2' }}
                      </td>
                    </ng-container>
                    <ng-container matColumnDef="ref">
                      <th mat-header-cell *matHeaderCellDef>Ref</th>
                      <td mat-cell *matCellDef="let t">{{ t.referenceNo || '—' }}</td>
                    </ng-container>
                    <ng-container matColumnDef="actions">
                      <th mat-header-cell *matHeaderCellDef></th>
                      <td mat-cell *matCellDef="let t">
                        <button mat-icon-button color="warn" (click)="deleteTransaction(t.id)" matTooltip="Void">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="txCols"></tr>
                    <tr mat-row *matRowDef="let row; columns: txCols"></tr>
                  </table>
                  <div class="pagination-row">
                    <span>{{ txTotal }} entries</span>
                    <div>
                      <button mat-icon-button [disabled]="txPage === 1" (click)="txPage=txPage-1;loadTransactions()">
                        <mat-icon>chevron_left</mat-icon>
                      </button>
                      <span>{{ txPage }} / {{ txPages }}</span>
                      <button mat-icon-button [disabled]="txPage >= txPages" (click)="txPage=txPage+1;loadTransactions()">
                        <mat-icon>chevron_right</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </mat-card-content>
            </mat-card>

          </div>
        </mat-tab>

        <!-- ── TAB 3: REPORTS ── -->
        <mat-tab label="Reports">
          <div class="tab-content">
            <mat-tab-group animationDuration="150ms">

              <!-- Trial Balance -->
              <mat-tab label="Trial Balance">
                <div style="padding:16px">
                  <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
                    <button mat-raised-button color="primary" (click)="loadTrialBalance()" [disabled]="loadingTB">
                      @if (loadingTB) { <mat-spinner diameter="18"/> } @else { <mat-icon>refresh</mat-icon> }
                      Refresh
                    </button>
                  </div>
                  @if (trialBalance) {
                    <table mat-table [dataSource]="trialBalance.rows" style="width:100%">
                      <ng-container matColumnDef="accountNumber">
                        <th mat-header-cell *matHeaderCellDef>#</th>
                        <td mat-cell *matCellDef="let r">{{ r.accountNumber }}</td>
                      </ng-container>
                      <ng-container matColumnDef="name">
                        <th mat-header-cell *matHeaderCellDef>Account</th>
                        <td mat-cell *matCellDef="let r">{{ r.name }}</td>
                      </ng-container>
                      <ng-container matColumnDef="type">
                        <th mat-header-cell *matHeaderCellDef>Type</th>
                        <td mat-cell *matCellDef="let r">
                          <span class="type-chip" [class]="'root-' + r.rootType">{{ r.accountType }}</span>
                        </td>
                      </ng-container>
                      <ng-container matColumnDef="debit">
                        <th mat-header-cell *matHeaderCellDef style="text-align:right">Debit</th>
                        <td mat-cell *matCellDef="let r" style="text-align:right">{{ r.debit | number:'1.2-2' }}</td>
                      </ng-container>
                      <ng-container matColumnDef="credit">
                        <th mat-header-cell *matHeaderCellDef style="text-align:right">Credit</th>
                        <td mat-cell *matCellDef="let r" style="text-align:right">{{ r.credit | number:'1.2-2' }}</td>
                      </ng-container>
                      <tr mat-header-row *matHeaderRowDef="tbCols"></tr>
                      <tr mat-row *matRowDef="let row; columns: tbCols"></tr>
                      <tr class="mat-footer-row">
                        <td colspan="3" style="padding:8px;font-weight:600">Totals</td>
                        <td style="text-align:right;padding:8px;font-weight:600">{{ trialBalance.totalDebit | number:'1.2-2' }}</td>
                        <td style="text-align:right;padding:8px;font-weight:600">{{ trialBalance.totalCredit | number:'1.2-2' }}</td>
                      </tr>
                    </table>
                  } @else if (!loadingTB) {
                    <p style="text-align:center;color:#888;padding:24px">Click Refresh to load trial balance.</p>
                  }
                </div>
              </mat-tab>

              <!-- Profit & Loss -->
              <mat-tab label="Profit & Loss">
                <div style="padding:16px">
                  <div class="report-filter-row">
                    <mat-form-field appearance="outline" style="width:160px">
                      <mat-label>From</mat-label>
                      <input matInput type="date" [(ngModel)]="plStart" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" style="width:160px">
                      <mat-label>To</mat-label>
                      <input matInput type="date" [(ngModel)]="plEnd" />
                    </mat-form-field>
                    <button mat-raised-button color="primary" (click)="loadProfitLoss()" [disabled]="loadingPL">
                      @if (loadingPL) { <mat-spinner diameter="18"/> } @else { <mat-icon>bar_chart</mat-icon> }
                      Generate
                    </button>
                  </div>
                  @if (profitLoss) {
                    <div class="pl-layout">
                      <!-- Revenue -->
                      <mat-card class="report-section">
                        <mat-card-header>
                          <mat-card-title style="color:#2e7d32">Revenue</mat-card-title>
                        </mat-card-header>
                        <mat-card-content>
                          @for (r of profitLoss.revenue; track r.id) {
                            <div class="report-row">
                              <span>{{ r.name }}</span>
                              <span>{{ r.balance | number:'1.2-2' }}</span>
                            </div>
                          }
                          <mat-divider />
                          <div class="report-row total-row">
                            <strong>Total Revenue</strong>
                            <strong>{{ profitLoss.totalRevenue | number:'1.2-2' }}</strong>
                          </div>
                        </mat-card-content>
                      </mat-card>
                      <!-- Expenses -->
                      <mat-card class="report-section">
                        <mat-card-header>
                          <mat-card-title style="color:#c62828">Expenses</mat-card-title>
                        </mat-card-header>
                        <mat-card-content>
                          @for (e of profitLoss.expenses; track e.id) {
                            <div class="report-row">
                              <span>{{ e.name }}</span>
                              <span>{{ e.balance | number:'1.2-2' }}</span>
                            </div>
                          }
                          <mat-divider />
                          <div class="report-row total-row">
                            <strong>Total Expenses</strong>
                            <strong>{{ profitLoss.totalExpenses | number:'1.2-2' }}</strong>
                          </div>
                        </mat-card-content>
                      </mat-card>
                    </div>
                    <mat-card [class.profit-card]="profitLoss.netProfit >= 0" [class.loss-card]="profitLoss.netProfit < 0" style="margin-top:12px">
                      <mat-card-content style="display:flex;justify-content:space-between;align-items:center;padding:16px">
                        <strong style="font-size:1.1em">{{ profitLoss.netProfit >= 0 ? 'Net Profit' : 'Net Loss' }}</strong>
                        <strong style="font-size:1.2em">{{ profitLoss.netProfit | number:'1.2-2' }}</strong>
                      </mat-card-content>
                    </mat-card>
                  } @else if (!loadingPL) {
                    <p style="text-align:center;color:#888;padding:24px">Set a date range and click Generate.</p>
                  }
                </div>
              </mat-tab>

              <!-- Balance Sheet -->
              <mat-tab label="Balance Sheet">
                <div style="padding:16px">
                  <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
                    <button mat-raised-button color="primary" (click)="loadBalanceSheet()" [disabled]="loadingBS">
                      @if (loadingBS) { <mat-spinner diameter="18"/> } @else { <mat-icon>refresh</mat-icon> }
                      Refresh
                    </button>
                  </div>
                  @if (balanceSheet) {
                    <div class="bs-layout">
                      <!-- Assets -->
                      <mat-card class="report-section">
                        <mat-card-header>
                          <mat-card-title>Assets</mat-card-title>
                        </mat-card-header>
                        <mat-card-content>
                          @for (a of balanceSheet.assets; track a.id) {
                            <div class="report-row">
                              <span>{{ a.accountNumber }} {{ a.name }}</span>
                              <span>{{ a.balance | number:'1.2-2' }}</span>
                            </div>
                          }
                          <mat-divider />
                          <div class="report-row total-row">
                            <strong>Total Assets</strong>
                            <strong>{{ balanceSheet.totalAssets | number:'1.2-2' }}</strong>
                          </div>
                        </mat-card-content>
                      </mat-card>
                      <!-- Liabilities + Equity -->
                      <div>
                        <mat-card class="report-section" style="margin-bottom:12px">
                          <mat-card-header>
                            <mat-card-title>Liabilities</mat-card-title>
                          </mat-card-header>
                          <mat-card-content>
                            @for (l of balanceSheet.liabilities; track l.id) {
                              <div class="report-row">
                                <span>{{ l.accountNumber }} {{ l.name }}</span>
                                <span>{{ l.balance | number:'1.2-2' }}</span>
                              </div>
                            }
                            <mat-divider />
                            <div class="report-row total-row">
                              <strong>Total Liabilities</strong>
                              <strong>{{ balanceSheet.totalLiabilities | number:'1.2-2' }}</strong>
                            </div>
                          </mat-card-content>
                        </mat-card>
                        <mat-card class="report-section">
                          <mat-card-header>
                            <mat-card-title>Equity</mat-card-title>
                          </mat-card-header>
                          <mat-card-content>
                            @for (e of balanceSheet.equity; track e.id) {
                              <div class="report-row">
                                <span>{{ e.accountNumber }} {{ e.name }}</span>
                                <span>{{ e.balance | number:'1.2-2' }}</span>
                              </div>
                            }
                            <mat-divider />
                            <div class="report-row total-row">
                              <strong>Total Equity</strong>
                              <strong>{{ balanceSheet.totalEquity | number:'1.2-2' }}</strong>
                            </div>
                          </mat-card-content>
                        </mat-card>
                        <div class="report-row total-row" style="padding:12px;background:#f5f5f5;border-radius:4px;margin-top:8px">
                          <strong>Total Liabilities + Equity</strong>
                          <strong>{{ balanceSheet.totalLiabilitiesAndEquity | number:'1.2-2' }}</strong>
                        </div>
                      </div>
                    </div>
                  } @else if (!loadingBS) {
                    <p style="text-align:center;color:#888;padding:24px">Click Refresh to load balance sheet.</p>
                  }
                </div>
              </mat-tab>
            </mat-tab-group>
          </div>
        </mat-tab>

      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .tab-content { padding: 1.5rem 0; }
    .two-column-layout { display: grid; grid-template-columns: 380px 1fr; gap: 1.5rem; }
    .form-card, .list-card { border-radius: 12px; overflow: hidden; height: fit-content; }
    .full-width { width: 100%; }
    .form-actions { display: flex; gap: 8px; margin-top: 8px; }
    .card-avatar-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; }
    .card-avatar-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .card-avatar-icon.orange { color: #f57c00; background: #fff3e0; }
    .card-avatar-icon.green  { color: #388e3c; background: #e8f5e9; }
    .card-avatar-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .card-avatar-icon mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    .type-chip { padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .root-asset { background: #e3f2fd; color: #1565c0; }
    .root-liability { background: #fce4ec; color: #880e4f; }
    .root-equity { background: #e8f5e9; color: #2e7d32; }
    .root-revenue { background: #f3e5f5; color: #6a1b9a; }
    .root-expense { background: #fff3e0; color: #e65100; }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }
    .debit-chip { background: #fff3e0; color: #e65100; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .credit-chip { background: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 4px; font-size: 12px; }
    .pagination-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; }
    .report-filter-row { display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .pl-layout, .bs-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .report-section { border-radius: 12px; overflow: hidden; }
    .report-section mat-card-header { margin-bottom: 8px; }
    .report-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
    .total-row { padding-top: 8px; margin-top: 4px; }
    .profit-card { border-left: 4px solid #2e7d32; }
    .loss-card { border-left: 4px solid #c62828; }
    @media (max-width: 900px) {
      .two-column-layout, .pl-layout, .bs-layout { grid-template-columns: 1fr; }
    }
  `],
})
export class AccountingComponent implements OnInit {
  private accountingService = inject(AccountingService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  // Account Types
  accountTypes: AccountType[] = [];
  savingType = false;
  typeForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    rootType: ['asset', Validators.required],
  });

  rootTypes = [
    { value: 'asset', label: 'Asset' },
    { value: 'liability', label: 'Liability' },
    { value: 'equity', label: 'Equity' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expense', label: 'Expense' },
  ];

  // Accounts
  accounts: Account[] = [];
  loadingAccounts = false;
  savingAccount = false;
  editingAccount: Account | null = null;
  accountSearch = '';
  accountCols = ['accountNumber', 'name', 'type', 'balance', 'actions'];
  accountForm: FormGroup = this.fb.group({
    accountNumber: ['', Validators.required],
    name: ['', Validators.required],
    accountTypeId: [null, Validators.required],
    note: [''],
  });

  get filteredAccounts(): Account[] {
    if (!this.accountSearch.trim()) return this.accounts;
    const q = this.accountSearch.toLowerCase();
    return this.accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q),
    );
  }

  // Transactions
  transactions: AccountTransaction[] = [];
  loadingTx = false;
  savingTx = false;
  txFilterAccountId: number | null = null;
  txPage = 1;
  txPages = 1;
  txTotal = 0;
  txCols = ['date', 'account', 'type', 'amount', 'ref', 'actions'];
  subTypes = [
    { value: 'opening_balance', label: 'Opening Balance' },
    { value: 'fund_transfer', label: 'Fund Transfer' },
    { value: 'deposit', label: 'Deposit' },
    { value: 'journal', label: 'Journal' },
    { value: 'sale', label: 'Sale' },
    { value: 'purchase', label: 'Purchase' },
    { value: 'payment', label: 'Payment' },
  ];
  txForm: FormGroup = this.fb.group({
    accountId: [null, Validators.required],
    type: ['debit', Validators.required],
    subType: [''],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    operationDate: [new Date().toISOString().split('T')[0], Validators.required],
    referenceNo: [''],
    note: [''],
  });

  // Reports
  trialBalance: TrialBalance | null = null;
  loadingTB = false;
  tbCols = ['accountNumber', 'name', 'type', 'debit', 'credit'];

  profitLoss: ProfitLoss | null = null;
  loadingPL = false;
  plStart = `${new Date().getFullYear()}-01-01`;
  plEnd = new Date().toISOString().split('T')[0];

  balanceSheet: BalanceSheet | null = null;
  loadingBS = false;

  ngOnInit() {
    this.loadAccountTypes();
    this.loadAccounts();
  }

  onTabChange(index: number) {
    if (index === 1 && this.transactions.length === 0) this.loadTransactions();
  }

  // ─── Account Types ────────────────────────────────────────────────

  loadAccountTypes() {
    this.accountingService.getAccountTypes().subscribe({
      next: (types) => (this.accountTypes = types),
      error: () => this.snack('Failed to load account types'),
    });
  }

  saveAccountType() {
    if (this.typeForm.invalid) return;
    this.savingType = true;
    this.accountingService.createAccountType(this.typeForm.value).subscribe({
      next: () => {
        this.snack('Account type created');
        this.typeForm.patchValue({ name: '' });
        this.loadAccountTypes();
        this.savingType = false;
      },
      error: (e) => {
        this.snack(e?.error?.message || 'Failed');
        this.savingType = false;
      },
    });
  }

  // ─── Accounts ─────────────────────────────────────────────────────

  loadAccounts() {
    this.loadingAccounts = true;
    this.accountingService.getAccounts(true).subscribe({
      next: (accs) => {
        this.accounts = accs;
        this.loadingAccounts = false;
      },
      error: () => {
        this.loadingAccounts = false;
        this.snack('Failed to load accounts');
      },
    });
  }

  saveAccount() {
    if (this.accountForm.invalid) return;
    this.savingAccount = true;
    const dto = this.accountForm.value;
    const req = this.editingAccount
      ? this.accountingService.updateAccount(this.editingAccount.id, dto)
      : this.accountingService.createAccount(dto);

    req.subscribe({
      next: () => {
        this.snack(this.editingAccount ? 'Account updated' : 'Account created');
        this.accountForm.reset({ note: '' });
        this.editingAccount = null;
        this.loadAccounts();
        this.savingAccount = false;
      },
      error: (e) => {
        this.snack(e?.error?.message || 'Failed');
        this.savingAccount = false;
      },
    });
  }

  editAccount(acc: Account) {
    this.editingAccount = acc;
    this.accountForm.patchValue({
      accountNumber: acc.accountNumber,
      name: acc.name,
      accountTypeId: acc.accountTypeId,
      note: acc.note || '',
    });
  }

  cancelEditAccount() {
    this.editingAccount = null;
    this.accountForm.reset({ note: '' });
  }

  deleteAccount(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Account', message: 'Delete this account?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.accountingService.deleteAccount(id).subscribe({
        next: () => {
          this.snack('Account deleted');
          this.loadAccounts();
        },
        error: (e) => this.snack(e?.error?.message || 'Cannot delete'),
      });
    });
  }

  // ─── Transactions ─────────────────────────────────────────────────

  loadTransactions() {
    this.loadingTx = true;
    this.accountingService
      .getTransactions({
        accountId: this.txFilterAccountId ?? undefined,
        page: this.txPage,
        limit: 30,
      })
      .subscribe({
        next: (res) => {
          this.transactions = res.data;
          this.txTotal = res.total;
          this.txPages = res.pages || 1;
          this.loadingTx = false;
        },
        error: () => {
          this.loadingTx = false;
          this.snack('Failed to load transactions');
        },
      });
  }

  saveTransaction() {
    if (this.txForm.invalid) return;
    this.savingTx = true;
    const v = this.txForm.value;
    this.accountingService
      .createTransaction({
        accountId: v.accountId,
        type: v.type,
        subType: v.subType || undefined,
        amount: +v.amount,
        referenceNo: v.referenceNo || undefined,
        operationDate: v.operationDate,
        note: v.note || undefined,
      })
      .subscribe({
        next: () => {
          this.snack('Entry posted');
          this.txForm.patchValue({
            accountId: null,
            type: 'debit',
            subType: '',
            amount: null,
            referenceNo: '',
            note: '',
          });
          this.loadTransactions();
          this.loadAccounts(); // refresh balances
          this.savingTx = false;
        },
        error: (e) => {
          this.snack(e?.error?.message || 'Failed');
          this.savingTx = false;
        },
      });
  }

  deleteTransaction(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Void Entry', message: 'Void this entry?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.accountingService.deleteTransaction(id).subscribe({
        next: () => {
          this.snack('Entry voided');
          this.loadTransactions();
          this.loadAccounts();
        },
        error: (e) => this.snack(e?.error?.message || 'Cannot void'),
      });
    });
  }

  // ─── Reports ──────────────────────────────────────────────────────

  loadTrialBalance() {
    this.loadingTB = true;
    this.accountingService.getTrialBalance().subscribe({
      next: (tb) => {
        this.trialBalance = tb;
        this.loadingTB = false;
      },
      error: () => {
        this.loadingTB = false;
        this.snack('Failed to load trial balance');
      },
    });
  }

  loadProfitLoss() {
    this.loadingPL = true;
    this.accountingService.getProfitLoss(this.plStart, this.plEnd).subscribe({
      next: (pl) => {
        this.profitLoss = pl;
        this.loadingPL = false;
      },
      error: () => {
        this.loadingPL = false;
        this.snack('Failed to load P&L');
      },
    });
  }

  loadBalanceSheet() {
    this.loadingBS = true;
    this.accountingService.getBalanceSheet().subscribe({
      next: (bs) => {
        this.balanceSheet = bs;
        this.loadingBS = false;
      },
      error: () => {
        this.loadingBS = false;
        this.snack('Failed to load balance sheet');
      },
    });
  }

  private snack(msg: string) {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
