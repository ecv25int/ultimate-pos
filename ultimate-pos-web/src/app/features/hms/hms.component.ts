import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HmsService } from '../../core/services/hms.service';
import { HmsRoomType, HmsRoom, HmsExtra, HmsDashboard } from '../../core/models/hms.model';

@Component({
  selector: 'app-hms',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule,
    MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header"><h1>Hotel Management (HMS)</h1></div>

      <div class="dashboard-cards" *ngIf="dashboard()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.totalRoomTypes }}</div>
            <div class="stat-label">Room Types</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.totalRooms }}</div>
            <div class="stat-label">Total Rooms</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.activeExtras }}</div>
            <div class="stat-label">Active Extras</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- ROOM TYPES TAB -->
        <mat-tab label="Room Types">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>New Room Type</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="roomTypeForm" (ngSubmit)="submitRoomType()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Type Name</mat-label>
                      <input matInput formControlName="type" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Adults</mat-label>
                      <input matInput type="number" formControlName="noOfAdult" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Children</mat-label>
                      <input matInput type="number" formControlName="noOfChild" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Max Occupancy</mat-label>
                      <input matInput type="number" formControlName="maxOccupancy" />
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <input matInput formControlName="description" />
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="roomTypeForm.invalid">Add Room Type</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <div *ngIf="loading()" class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
                <table mat-table [dataSource]="roomTypes()" *ngIf="!loading()">
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let r">{{ r.type }}</td>
                  </ng-container>
                  <ng-container matColumnDef="noOfAdult">
                    <th mat-header-cell *matHeaderCellDef>Adults</th>
                    <td mat-cell *matCellDef="let r">{{ r.noOfAdult }}</td>
                  </ng-container>
                  <ng-container matColumnDef="noOfChild">
                    <th mat-header-cell *matHeaderCellDef>Children</th>
                    <td mat-cell *matCellDef="let r">{{ r.noOfChild }}</td>
                  </ng-container>
                  <ng-container matColumnDef="maxOccupancy">
                    <th mat-header-cell *matHeaderCellDef>Max</th>
                    <td mat-cell *matCellDef="let r">{{ r.maxOccupancy }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deleteRoomType(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="roomTypeCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: roomTypeCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- ROOMS TAB -->
        <mat-tab label="Rooms">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Add Room</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="roomForm" (ngSubmit)="submitRoom()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Room Number</mat-label>
                      <input matInput formControlName="roomNumber" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Room Type</mat-label>
                      <mat-select formControlName="hmsRoomTypeId">
                        <mat-option *ngFor="let rt of roomTypes()" [value]="rt.id">{{ rt.type }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="roomForm.invalid">Add Room</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="rooms()">
                  <ng-container matColumnDef="roomNumber">
                    <th mat-header-cell *matHeaderCellDef>Room Number</th>
                    <td mat-cell *matCellDef="let r">{{ r.roomNumber }}</td>
                  </ng-container>
                  <ng-container matColumnDef="hmsRoomTypeId">
                    <th mat-header-cell *matHeaderCellDef>Type ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.hmsRoomTypeId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deleteRoom(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="roomCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: roomCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- EXTRAS TAB -->
        <mat-tab label="Extras">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Add Extra</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="extraForm" (ngSubmit)="submitExtra()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Price</mat-label>
                      <input matInput type="number" formControlName="price" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Price Per</mat-label>
                      <mat-select formControlName="pricePer">
                        <mat-option value="night">Night</mat-option>
                        <mat-option value="day">Day</mat-option>
                        <mat-option value="person">Person</mat-option>
                        <mat-option value="booking">Booking</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="extraForm.invalid">Add Extra</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="extras()">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let r">{{ r.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="price">
                    <th mat-header-cell *matHeaderCellDef>Price</th>
                    <td mat-cell *matCellDef="let r">{{ r.price }}</td>
                  </ng-container>
                  <ng-container matColumnDef="pricePer">
                    <th mat-header-cell *matHeaderCellDef>Per</th>
                    <td mat-cell *matCellDef="let r">{{ r.pricePer }}</td>
                  </ng-container>
                  <ng-container matColumnDef="isActive">
                    <th mat-header-cell *matHeaderCellDef>Active</th>
                    <td mat-cell *matCellDef="let r"><mat-chip [color]="r.isActive ? 'primary' : 'warn'" highlighted>{{ r.isActive ? 'Yes' : 'No' }}</mat-chip></td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deleteExtra(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="extraCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: extraCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .page-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .dashboard-cards { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 24px; }
    .stat-card { min-width: 140px; }
    .stat-value { font-size: 1.8rem; font-weight: 700; }
    .stat-label { font-size: 0.85rem; color: #666; }
    .tab-content { padding: 16px 0; display: flex; flex-direction: column; gap: 16px; }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .full-width { width: 100%; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
    mat-form-field { min-width: 180px; }
    table { width: 100%; }
  `],
})
export class HmsComponent implements OnInit {
  private svc = inject(HmsService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  dashboard = signal<HmsDashboard | null>(null);
  roomTypes = signal<HmsRoomType[]>([]);
  rooms = signal<HmsRoom[]>([]);
  extras = signal<HmsExtra[]>([]);

  roomTypeCols = ['type', 'noOfAdult', 'noOfChild', 'maxOccupancy', 'actions'];
  roomCols = ['roomNumber', 'hmsRoomTypeId', 'actions'];
  extraCols = ['name', 'price', 'pricePer', 'isActive', 'actions'];

  roomTypeForm = this.fb.group({ type: ['', Validators.required], noOfAdult: [2, Validators.required], noOfChild: [0], maxOccupancy: [2, Validators.required], description: [null as string | null] });
  roomForm = this.fb.group({ roomNumber: ['', Validators.required], hmsRoomTypeId: [null as number | null, Validators.required] });
  extraForm = this.fb.group({ name: ['', Validators.required], price: [0], pricePer: ['night', Validators.required] });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.svc.getDashboard().subscribe(d => this.dashboard.set(d));
    this.svc.getRoomTypes().subscribe(d => { this.roomTypes.set(d); this.loading.set(false); });
    this.svc.getRooms().subscribe(d => this.rooms.set(d));
    this.svc.getExtras().subscribe(d => this.extras.set(d));
  }

  submitRoomType() {
    if (this.roomTypeForm.invalid) return;
    this.svc.createRoomType(this.roomTypeForm.value as any).subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.roomTypeForm.reset({ noOfAdult: 2, noOfChild: 0, maxOccupancy: 2 }); this.loadAll(); } });
  }
  deleteRoomType(id: number) { this.svc.deleteRoomType(id).subscribe({ next: () => this.loadAll() }); }

  submitRoom() {
    if (this.roomForm.invalid) return;
    this.svc.createRoom(this.roomForm.value as any).subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.roomForm.reset(); this.loadAll(); } });
  }
  deleteRoom(id: number) { this.svc.deleteRoom(id).subscribe({ next: () => this.loadAll() }); }

  submitExtra() {
    if (this.extraForm.invalid) return;
    this.svc.createExtra(this.extraForm.value as any).subscribe({ next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.extraForm.reset({ price: 0, pricePer: 'night' }); this.loadAll(); } });
  }
  deleteExtra(id: number) { this.svc.deleteExtra(id).subscribe({ next: () => this.loadAll() }); }
}
