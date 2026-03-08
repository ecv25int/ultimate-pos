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
import { ProjectService } from '../../core/services/project.service';
import { PjtProject, PjtTask, PjtTimeLog, ProjectDashboard } from '../../core/models/project.model';

@Component({
  selector: 'app-project',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTabsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatCardModule, MatSelectModule,
    MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <div class="page-header"><h1>Project Management</h1></div>

      <div class="dashboard-cards" *ngIf="dashboard()">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.totalProjects }}</div>
            <div class="stat-label">Total Projects</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card" *ngFor="let s of dashboard()!.byStatus">
          <mat-card-content>
            <div class="stat-value">{{ s._count }}</div>
            <div class="stat-label">{{ s.status }}</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-value">{{ dashboard()!.overdueTasksCount }}</div>
            <div class="stat-label">Overdue Tasks</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <!-- PROJECTS TAB -->
        <mat-tab label="Projects">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>{{ editingProjectId() ? 'Edit Project' : 'New Project' }}</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="projectForm" (ngSubmit)="submitProject()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Project Name</mat-label>
                      <input matInput formControlName="name" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Status</mat-label>
                      <mat-select formControlName="status">
                        <mat-option value="not_started">Not Started</mat-option>
                        <mat-option value="in_progress">In Progress</mat-option>
                        <mat-option value="completed">Completed</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Start Date</mat-label>
                      <input matInput type="date" formControlName="startDate" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>End Date</mat-label>
                      <input matInput type="date" formControlName="endDate" />
                    </mat-form-field>
                  </div>
                  <div class="form-row">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Description</mat-label>
                      <textarea matInput formControlName="description" rows="2"></textarea>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="projectForm.invalid">
                    {{ editingProjectId() ? 'Update' : 'Create' }}
                  </button>
                  <button mat-button type="button" (click)="cancelProjectEdit()" *ngIf="editingProjectId()">Cancel</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <div *ngIf="loading()" class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>
                <table mat-table [dataSource]="projects()" *ngIf="!loading()">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Name</th>
                    <td mat-cell *matCellDef="let r">{{ r.name }}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let r"><mat-chip>{{ r.status }}</mat-chip></td>
                  </ng-container>
                  <ng-container matColumnDef="startDate">
                    <th mat-header-cell *matHeaderCellDef>Start</th>
                    <td mat-cell *matCellDef="let r">{{ r.startDate | date:'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="endDate">
                    <th mat-header-cell *matHeaderCellDef>End</th>
                    <td mat-cell *matCellDef="let r">{{ r.endDate | date:'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="primary" (click)="editProject(r)"><mat-icon>edit</mat-icon></button>
                      <button mat-icon-button color="warn" (click)="deleteProject(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="projectCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: projectCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- TASKS TAB -->
        <mat-tab label="Tasks">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>New Task</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="taskForm" (ngSubmit)="submitTask()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Subject</mat-label>
                      <input matInput formControlName="subject" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Project</mat-label>
                      <mat-select formControlName="projectId">
                        <mat-option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Priority</mat-label>
                      <mat-select formControlName="priority">
                        <mat-option value="low">Low</mat-option>
                        <mat-option value="medium">Medium</mat-option>
                        <mat-option value="high">High</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Status</mat-label>
                      <mat-select formControlName="status">
                        <mat-option value="not_started">Not Started</mat-option>
                        <mat-option value="in_progress">In Progress</mat-option>
                        <mat-option value="completed">Completed</mat-option>
                      </mat-select>
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="taskForm.invalid">Add Task</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="tasks()">
                  <ng-container matColumnDef="subject">
                    <th mat-header-cell *matHeaderCellDef>Subject</th>
                    <td mat-cell *matCellDef="let r">{{ r.subject }}</td>
                  </ng-container>
                  <ng-container matColumnDef="priority">
                    <th mat-header-cell *matHeaderCellDef>Priority</th>
                    <td mat-cell *matCellDef="let r"><mat-chip>{{ r.priority }}</mat-chip></td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Status</th>
                    <td mat-cell *matCellDef="let r"><mat-chip>{{ r.status }}</mat-chip></td>
                  </ng-container>
                  <ng-container matColumnDef="dueDate">
                    <th mat-header-cell *matHeaderCellDef>Due Date</th>
                    <td mat-cell *matCellDef="let r">{{ r.dueDate | date:'mediumDate' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let r">
                      <button mat-icon-button color="warn" (click)="deleteTask(r.id)"><mat-icon>delete</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="taskCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: taskCols;"></tr>
                </table>
              </mat-card-content>
            </mat-card>
          </div>
        </mat-tab>

        <!-- TIME LOGS TAB -->
        <mat-tab label="Time Logs">
          <div class="tab-content">
            <mat-card class="form-card">
              <mat-card-header><mat-card-title>Log Time</mat-card-title></mat-card-header>
              <mat-card-content>
                <form [formGroup]="timeLogForm" (ngSubmit)="submitTimeLog()">
                  <div class="form-row">
                    <mat-form-field appearance="outline">
                      <mat-label>Project</mat-label>
                      <mat-select formControlName="projectId">
                        <mat-option *ngFor="let p of projects()" [value]="p.id">{{ p.name }}</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Start Time</mat-label>
                      <input matInput type="datetime-local" formControlName="startTime" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>End Time</mat-label>
                      <input matInput type="datetime-local" formControlName="endTime" />
                    </mat-form-field>
                    <mat-form-field appearance="outline">
                      <mat-label>Note</mat-label>
                      <input matInput formControlName="note" />
                    </mat-form-field>
                  </div>
                  <button mat-raised-button color="primary" type="submit" [disabled]="timeLogForm.invalid">Save Time Log</button>
                </form>
              </mat-card-content>
            </mat-card>

            <mat-card>
              <mat-card-content>
                <table mat-table [dataSource]="timeLogs()">
                  <ng-container matColumnDef="projectId">
                    <th mat-header-cell *matHeaderCellDef>Project ID</th>
                    <td mat-cell *matCellDef="let r">{{ r.projectId }}</td>
                  </ng-container>
                  <ng-container matColumnDef="startTime">
                    <th mat-header-cell *matHeaderCellDef>Start</th>
                    <td mat-cell *matCellDef="let r">{{ r.startTime | date:'short' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="endTime">
                    <th mat-header-cell *matHeaderCellDef>End</th>
                    <td mat-cell *matCellDef="let r">{{ r.endTime | date:'short' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="duration">
                    <th mat-header-cell *matHeaderCellDef>Duration (min)</th>
                    <td mat-cell *matCellDef="let r">{{ r.duration }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="timeLogCols"></tr>
                  <tr mat-row *matRowDef="let row; columns: timeLogCols;"></tr>
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
    .form-card { }
    .form-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start; }
    .full-width { width: 100%; }
    .loading-container { display: flex; justify-content: center; padding: 24px; }
    mat-form-field { min-width: 180px; }
    table { width: 100%; }
  `],
})
export class ProjectComponent implements OnInit {
  private svc = inject(ProjectService);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  dashboard = signal<ProjectDashboard | null>(null);
  projects = signal<PjtProject[]>([]);
  tasks = signal<PjtTask[]>([]);
  timeLogs = signal<PjtTimeLog[]>([]);
  editingProjectId = signal<number | null>(null);

  projectCols = ['name', 'status', 'startDate', 'endDate', 'actions'];
  taskCols = ['subject', 'priority', 'status', 'dueDate', 'actions'];
  timeLogCols = ['projectId', 'startTime', 'endTime', 'duration'];

  projectForm = this.fb.group({
    name: ['', Validators.required],
    status: ['not_started'],
    startDate: [null as string | null],
    endDate: [null as string | null],
    description: [null as string | null],
  });

  taskForm = this.fb.group({
    projectId: [null as number | null, Validators.required],
    subject: ['', Validators.required],
    priority: ['low'],
    status: ['not_started'],
    dueDate: [null as string | null],
  });

  timeLogForm = this.fb.group({
    projectId: [null as number | null, Validators.required],
    startTime: ['', Validators.required],
    endTime: [null as string | null],
    note: [null as string | null],
  });

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loading.set(true);
    this.svc.getDashboard().subscribe(d => this.dashboard.set(d));
    this.svc.getProjects().subscribe(d => { this.projects.set(d); this.loading.set(false); });
    this.svc.getTasks().subscribe(d => this.tasks.set(d));
    this.svc.getTimeLogs().subscribe(d => this.timeLogs.set(d));
  }

  submitProject() {
    if (this.projectForm.invalid) return;
    const val = this.projectForm.value as any;
    const id = this.editingProjectId();
    const obs = id ? this.svc.updateProject(id, val) : this.svc.createProject(val);
    obs.subscribe({
      next: () => { this.snack.open('Saved', 'Close', { duration: 2000 }); this.cancelProjectEdit(); this.loadAll(); },
      error: () => this.snack.open('Error saving project', 'Close', { duration: 3000 }),
    });
  }

  editProject(p: PjtProject) {
    this.editingProjectId.set(p.id);
    this.projectForm.patchValue({ name: p.name, status: p.status, description: p.description ?? null });
  }

  cancelProjectEdit() {
    this.editingProjectId.set(null);
    this.projectForm.reset({ status: 'not_started' });
  }

  deleteProject(id: number) {
    this.svc.deleteProject(id).subscribe({ next: () => this.loadAll(), error: () => this.snack.open('Error', 'Close', { duration: 3000 }) });
  }

  submitTask() {
    if (this.taskForm.invalid) return;
    this.svc.createTask(this.taskForm.value as any).subscribe({
      next: () => { this.snack.open('Task created', 'Close', { duration: 2000 }); this.taskForm.reset({ priority: 'low', status: 'not_started' }); this.loadAll(); },
      error: () => this.snack.open('Error', 'Close', { duration: 3000 }),
    });
  }

  deleteTask(id: number) {
    this.svc.deleteTask(id).subscribe({ next: () => this.loadAll() });
  }

  submitTimeLog() {
    if (this.timeLogForm.invalid) return;
    this.svc.createTimeLog(this.timeLogForm.value as any).subscribe({
      next: () => { this.snack.open('Time logged', 'Close', { duration: 2000 }); this.timeLogForm.reset(); this.loadAll(); },
      error: () => this.snack.open('Error', 'Close', { duration: 3000 }),
    });
  }
}
