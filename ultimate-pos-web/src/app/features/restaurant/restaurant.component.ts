import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { RestaurantService } from '../../core/services/restaurant.service';
import { ResTable, Booking, RestaurantDashboard } from '../../core/models/restaurant.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-restaurant',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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
    MatTabsModule,
    MatChipsModule,
    MatBadgeModule,
    MatDividerModule,
    DatePipe,
  ],
  template: `
<div class="restaurant-container">
  <div class="page-header">
    <h1><mat-icon>restaurant</mat-icon> Restaurant</h1>
  </div>

  <!-- Dashboard summary -->
  @if (dashboard) {
  <div class="stats-row">
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-value">{{ dashboard.totalTables }}</div>
        <div class="stat-label">Total Tables</div>
      </mat-card-content>
    </mat-card>
    <mat-card class="stat-card available">
      <mat-card-content>
        <div class="stat-value">{{ dashboard.byStatus['available'] }}</div>
        <div class="stat-label">Available</div>
      </mat-card-content>
    </mat-card>
    <mat-card class="stat-card occupied">
      <mat-card-content>
        <div class="stat-value">{{ dashboard.byStatus['occupied'] }}</div>
        <div class="stat-label">Occupied</div>
      </mat-card-content>
    </mat-card>
    <mat-card class="stat-card">
      <mat-card-content>
        <div class="stat-value">{{ dashboard.todayBookings }}</div>
        <div class="stat-label">Today's Bookings</div>
      </mat-card-content>
    </mat-card>
  </div>
  }

  <mat-tab-group animationDuration="200ms">

    <!-- ─── TABLES TAB ─────────────────────────────────────────── -->
    <mat-tab label="Tables">
      <div class="tab-content">
        <div class="section-header">
          <h2>Floor Plan</h2>
          <button mat-raised-button color="primary" (click)="openTableForm()">
            <mat-icon>add</mat-icon> Add Table
          </button>
        </div>

        @if (loadingTables) {
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        } @else {
          <div class="table-grid">
            @for (table of tables; track table.id) {
              <mat-card class="table-card" [class]="'status-' + table.status">
                <mat-card-content>
                  <div class="table-name">{{ table.name }}</div>
                  <div class="table-capacity">
                    <mat-icon>people</mat-icon> {{ table.capacity }}
                  </div>
                  <mat-chip [class]="'chip-' + table.status">
                    {{ table.status | titlecase }}
                  </mat-chip>
                  <div class="table-actions">
                    <button mat-icon-button matTooltip="Set Available"
                      (click)="setStatus(table, 'available')">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Set Occupied"
                      (click)="setStatus(table, 'occupied')">
                      <mat-icon>person</mat-icon>
                    </button>
                    <button mat-icon-button matTooltip="Edit"
                      (click)="openTableForm(table)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" matTooltip="Delete"
                      (click)="deleteTable(table.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </mat-card-content>
              </mat-card>
            }
            @empty {
              <p class="empty-state">No tables found. Add your first table.</p>
            }
          </div>
        }

        <!-- Table form panel -->
        @if (showTableForm) {
          <mat-card class="form-panel">
            <mat-card-header>
              <mat-card-title>{{ editingTable ? 'Edit Table' : 'New Table' }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="tableForm" (ngSubmit)="saveTable()">
                <mat-form-field appearance="outline">
                  <mat-label>Table Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g. Table 1" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Location ID</mat-label>
                  <input matInput type="number" formControlName="locationId" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Capacity</mat-label>
                  <input matInput type="number" formControlName="capacity" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Description</mat-label>
                  <input matInput formControlName="description" />
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="showTableForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit"
                    [disabled]="tableForm.invalid || saving">
                    {{ saving ? 'Saving...' : 'Save' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </mat-tab>

    <!-- ─── BOOKINGS TAB ───────────────────────────────────────── -->
    <mat-tab label="Bookings">
      <div class="tab-content">
        <div class="section-header">
          <h2>Reservations</h2>
          <div class="filter-row">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Date</mat-label>
              <input matInput type="date" [(ngModel)]="bookingFilter.date"
                (change)="loadBookings()" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="bookingFilter.status" (selectionChange)="loadBookings()">
                <mat-option value="">All</mat-option>
                <mat-option value="booked">Booked</mat-option>
                <mat-option value="completed">Completed</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
                <mat-option value="waiting">Waiting</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="openBookingForm()">
              <mat-icon>add</mat-icon> New Booking
            </button>
          </div>
        </div>

        @if (loadingBookings) {
          <mat-progress-spinner mode="indeterminate" diameter="40"></mat-progress-spinner>
        } @else {
          <table mat-table [dataSource]="bookings" class="full-width-table">
            <ng-container matColumnDef="contact">
              <th mat-header-cell *matHeaderCellDef>Guest</th>
              <td mat-cell *matCellDef="let b">{{ b.contact?.name ?? 'N/A' }}</td>
            </ng-container>
            <ng-container matColumnDef="table">
              <th mat-header-cell *matHeaderCellDef>Table</th>
              <td mat-cell *matCellDef="let b">{{ b.table?.name ?? '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="guests">
              <th mat-header-cell *matHeaderCellDef>Guests</th>
              <td mat-cell *matCellDef="let b">{{ b.guestCount }}</td>
            </ng-container>
            <ng-container matColumnDef="start">
              <th mat-header-cell *matHeaderCellDef>Start</th>
              <td mat-cell *matCellDef="let b">{{ b.bookingStart | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="end">
              <th mat-header-cell *matHeaderCellDef>End</th>
              <td mat-cell *matCellDef="let b">{{ b.bookingEnd | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let b">
                <mat-chip [class]="'chip-' + b.bookingStatus">
                  {{ b.bookingStatus | titlecase }}
                </mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let b">
                <button mat-icon-button matTooltip="Complete"
                  (click)="setBookingStatus(b.id, 'completed')">
                  <mat-icon>check</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Cancel" color="warn"
                  (click)="setBookingStatus(b.id, 'cancelled')">
                  <mat-icon>cancel</mat-icon>
                </button>
                <button mat-icon-button matTooltip="Delete" color="warn"
                  (click)="deleteBooking(b.id)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="bookingColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: bookingColumns;"></tr>
          </table>

          @if (bookings.length === 0) {
            <p class="empty-state">No bookings found.</p>
          }
        }

        <!-- Booking form -->
        @if (showBookingForm) {
          <mat-card class="form-panel">
            <mat-card-header>
              <mat-card-title>New Booking</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="bookingForm" (ngSubmit)="saveBooking()">
                <mat-form-field appearance="outline">
                  <mat-label>Contact ID</mat-label>
                  <input matInput type="number" formControlName="contactId" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Location ID</mat-label>
                  <input matInput type="number" formControlName="locationId" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Table</mat-label>
                  <mat-select formControlName="tableId">
                    <mat-option [value]="null">No Table</mat-option>
                    @for (t of tables; track t.id) {
                      <mat-option [value]="t.id">{{ t.name }} (cap: {{ t.capacity }})</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Booking Start</mat-label>
                  <input matInput type="datetime-local" formControlName="bookingStart" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Booking End</mat-label>
                  <input matInput type="datetime-local" formControlName="bookingEnd" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Guest Count</mat-label>
                  <input matInput type="number" formControlName="guestCount" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Note</mat-label>
                  <input matInput formControlName="bookingNote" />
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="showBookingForm = false">Cancel</button>
                  <button mat-raised-button color="primary" type="submit"
                    [disabled]="bookingForm.invalid || saving">
                    {{ saving ? 'Saving...' : 'Book' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </div>
    </mat-tab>
  </mat-tab-group>
</div>
  `,
  styles: [`
    .restaurant-container { padding: 24px; }
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .page-header h1 { display: flex; align-items: center; gap: 8px; margin: 0; }
    .stats-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { min-width: 150px; }
    .stat-card.available mat-card-content { border-left: 4px solid #4caf50; }
    .stat-card.occupied mat-card-content { border-left: 4px solid #f44336; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-label { color: rgba(0,0,0,.54); font-size: .85rem; }
    .tab-content { padding: 24px 0; }
    .section-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 20px; }
    .filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .filter-field { width: 160px; }
    .table-grid { display: flex; flex-wrap: wrap; gap: 16px; }
    .table-card { width: 180px; cursor: default; transition: box-shadow .2s; }
    .table-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.15); }
    .table-card.status-available { border-top: 4px solid #4caf50; }
    .table-card.status-occupied { border-top: 4px solid #f44336; }
    .table-card.status-reserved { border-top: 4px solid #ff9800; }
    .table-card.status-cleaning { border-top: 4px solid #9c27b0; }
    .table-name { font-size: 1.1rem; font-weight: 600; margin-bottom: 4px; }
    .table-capacity { display: flex; align-items: center; gap: 4px; color: rgba(0,0,0,.6); font-size: .85rem; margin-bottom: 8px; }
    .table-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
    .chip-available { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .chip-occupied { background: #ffebee !important; color: #c62828 !important; }
    .chip-reserved { background: #fff3e0 !important; color: #e65100 !important; }
    .chip-cleaning { background: #f3e5f5 !important; color: #6a1b9a !important; }
    .chip-booked { background: #e3f2fd !important; color: #1565c0 !important; }
    .chip-completed { background: #e8f5e9 !important; color: #2e7d32 !important; }
    .chip-cancelled { background: #ffebee !important; color: #c62828 !important; }
    .chip-waiting { background: #fff3e0 !important; color: #e65100 !important; }
    .full-width-table { width: 100%; }
    .form-panel { max-width: 600px; margin-top: 24px; }
    form { display: flex; flex-direction: column; gap: 12px; }
    mat-form-field { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; }
    .empty-state { color: rgba(0,0,0,.4); text-align: center; padding: 24px; }
  `],
})
export class RestaurantComponent implements OnInit {
  private restaurantService = inject(RestaurantService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  dashboard: RestaurantDashboard | null = null;
  tables: ResTable[] = [];
  bookings: Booking[] = [];

  loadingTables = false;
  loadingBookings = false;
  saving = false;

  showTableForm = false;
  showBookingForm = false;
  editingTable: ResTable | null = null;

  bookingFilter: { date?: string; status?: string } = {};

  bookingColumns = ['contact', 'table', 'guests', 'start', 'end', 'status', 'actions'];

  tableForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    locationId: [1, [Validators.required, Validators.min(1)]],
    capacity: [4, Validators.min(1)],
    description: [''],
  });

  bookingForm: FormGroup = this.fb.group({
    contactId: [null, [Validators.required, Validators.min(1)]],
    locationId: [1, [Validators.required, Validators.min(1)]],
    tableId: [null],
    bookingStart: ['', Validators.required],
    bookingEnd: ['', Validators.required],
    guestCount: [1, Validators.min(1)],
    bookingNote: [''],
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.restaurantService.getDashboard().subscribe({
      next: (d) => (this.dashboard = d),
    });
    this.loadTables();
    this.loadBookings();
  }

  loadTables(): void {
    this.loadingTables = true;
    this.restaurantService.getTables().subscribe({
      next: (t) => { this.tables = t; this.loadingTables = false; },
      error: () => this.loadingTables = false,
    });
  }

  loadBookings(): void {
    this.loadingBookings = true;
    this.restaurantService.getBookings(this.bookingFilter).subscribe({
      next: (b) => { this.bookings = b; this.loadingBookings = false; },
      error: () => this.loadingBookings = false,
    });
  }

  openTableForm(table?: ResTable): void {
    this.editingTable = table ?? null;
    this.tableForm.reset({
      name: table?.name ?? '',
      locationId: table?.locationId ?? 1,
      capacity: table?.capacity ?? 4,
      description: table?.description ?? '',
    });
    this.showTableForm = true;
  }

  saveTable(): void {
    if (this.tableForm.invalid) return;
    this.saving = true;
    const dto = this.tableForm.value;
    const action = this.editingTable
      ? this.restaurantService.updateTable(this.editingTable.id, dto)
      : this.restaurantService.createTable(dto);
    action.subscribe({
      next: () => {
        this.saving = false;
        this.showTableForm = false;
        this.loadTables();
        this.restaurantService.getDashboard().subscribe({ next: (d) => (this.dashboard = d) });
        this.snackBar.open('Table saved', 'OK', { duration: 2500 });
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving = false;
        this.snackBar.open(e.error?.message ?? 'Error saving table', 'OK', { duration: 3000 });
      },
    });
  }

  setStatus(table: ResTable, status: string): void {
    this.restaurantService.updateTable(table.id, { status }).subscribe({
      next: () => { this.loadTables(); this.restaurantService.getDashboard().subscribe({ next: (d) => (this.dashboard = d) }); },
    });
  }

  deleteTable(id: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Table', message: 'Delete this table?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.restaurantService.deleteTable(id).subscribe({
        next: () => { this.loadTables(); this.snackBar.open('Table deleted', 'OK', { duration: 2500 }); },
      });
    });
  }

  openBookingForm(): void {
    this.bookingForm.reset({ guestCount: 1, locationId: 1 });
    this.showBookingForm = true;
  }

  saveBooking(): void {
    if (this.bookingForm.invalid) return;
    this.saving = true;
    const v = this.bookingForm.value;
    const dto = {
      ...v,
      bookingStart: new Date(v.bookingStart).toISOString(),
      bookingEnd: new Date(v.bookingEnd).toISOString(),
    };
    this.restaurantService.createBooking(dto).subscribe({
      next: () => {
        this.saving = false;
        this.showBookingForm = false;
        this.loadBookings();
        this.restaurantService.getDashboard().subscribe({ next: (d) => (this.dashboard = d) });
        this.snackBar.open('Booking created', 'OK', { duration: 2500 });
      },
      error: (e: { error?: { message?: string } }) => {
        this.saving = false;
        this.snackBar.open(e.error?.message ?? 'Error creating booking', 'OK', { duration: 3000 });
      },
    });
  }

  setBookingStatus(id: number, status: string): void {
    this.restaurantService.updateBooking(id, { bookingStatus: status }).subscribe({
      next: () => { this.loadBookings(); this.snackBar.open('Booking updated', 'OK', { duration: 2000 }); },
    });
  }

  deleteBooking(id: number): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Booking', message: 'Delete this booking?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.restaurantService.deleteBooking(id).subscribe({
        next: () => { this.loadBookings(); this.snackBar.open('Booking deleted', 'OK', { duration: 2000 }); },
      });
    });
  }
}
