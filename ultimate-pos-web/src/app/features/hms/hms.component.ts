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
      <div class="page-header">
        <div class="header-title">
          <mat-icon class="header-icon">hotel</mat-icon>
          <div>
            <h1>Hotel Management (HMS)</h1>
            <p class="subtitle">Room types, rooms &amp; extras</p>
          </div>
        </div>
      </div>

      <div class="stats-row" *ngIf="dashboard()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon blue">category</mat-icon>
              <div>
                <div class="stat-number">{{ dashboard()!.totalRoomTypes }}</div>
                <div class="stat-label">Room Types</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon green">door_front</mat-icon>
              <div>
                <div class="stat-number">{{ dashboard()!.totalRooms }}</div>
                <div class="stat-label">Total Rooms</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-content">
              <mat-icon class="stat-icon orange">room_service</mat-icon>
              <div>
                <div class="stat-number">{{ dashboard()!.activeExtras }}</div>
                <div class="stat-label">Active Extras</div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- ROOM TYPES TAB -->
        <mat-tab label="Room Types">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>add_home</mat-icon></div>
                <mat-card-title>New Room Type</mat-card-title>
              </mat-card-header>
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

            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon orange"><mat-icon>category</mat-icon></div>
                <mat-card-title>Room Types</mat-card-title>
              </mat-card-header>
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
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>meeting_room</mat-icon></div>
                <mat-card-title>Add Room</mat-card-title>
              </mat-card-header>
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

            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon green"><mat-icon>door_front</mat-icon></div>
                <mat-card-title>Rooms</mat-card-title>
              </mat-card-header>
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
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon blue"><mat-icon>room_service</mat-icon></div>
                <mat-card-title>Add Extra</mat-card-title>
              </mat-card-header>
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

            <mat-card class="list-card">
              <mat-card-header>
                <div mat-card-avatar class="card-avatar-icon purple"><mat-icon>star</mat-icon></div>
                <mat-card-title>Extras</mat-card-title>
              </mat-card-header>
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
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-title { display: flex; align-items: center; gap: 1rem; }
    .header-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #1976d2; }
    h1 { margin: 0; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 4px 0 0; color: #666; font-size: 0.9rem; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { border-radius: 12px; overflow: hidden; }
    .stat-content { display: flex; align-items: center; gap: 1rem; padding: 0.5rem 0; }
    .stat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; border-radius: 10px; padding: 0.5rem; }
    .stat-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .stat-icon.green  { color: #388e3c; background: #e8f5e9; }
    .stat-icon.orange { color: #f57c00; background: #fff3e0; }
    .stat-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .stat-number { font-size: 1.75rem; font-weight: 700; line-height: 1; color: #1a1a1a; }
    .stat-label { font-size: 0.8rem; color: #666; margin-top: 0.25rem; }
    .tab-content { padding: 1.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }
    .form-card, .list-card { border-radius: 12px; overflow: hidden; }
    .card-avatar-icon { display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 12px; }
    .card-avatar-icon.blue   { color: #1976d2; background: #e3f2fd; }
    .card-avatar-icon.green  { color: #388e3c; background: #e8f5e9; }
    .card-avatar-icon.orange { color: #f57c00; background: #fff3e0; }
    .card-avatar-icon.purple { color: #7b1fa2; background: #f3e5f5; }
    .card-avatar-icon mat-icon { font-size: 1.75rem; width: 1.75rem; height: 1.75rem; }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-start; }
    .full-width { width: 100%; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
    mat-form-field { min-width: 180px; }
    table { width: 100%; }
    @media (max-width: 768px) { .stats-row { grid-template-columns: 1fr; } }
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
