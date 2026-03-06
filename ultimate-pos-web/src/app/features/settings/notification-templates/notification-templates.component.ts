import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationTemplatesService } from '../../../core/services/notification-templates.service';
import { NotificationTemplate, CreateNotificationTemplateDto } from '../../../core/models/notification-template.model';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';

const TEMPLATE_EVENTS = [
  'new_sale',
  'payment_received',
  'purchase_order_created',
  'low_stock',
  'customer_registration',
  'expense_added',
];

@Component({
  selector: 'app-notification-templates-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <div class="section-header">
        <h2>Notification Templates</h2>
        <button class="btn btn-primary" (click)="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ Add Template' }}
        </button>
      </div>

      <form class="form-card" *ngIf="showForm" (ngSubmit)="save()">
        <div class="form-row">
          <div class="form-group">
            <label>Template For (Event) *</label>
            <select [(ngModel)]="form.templateFor" name="templateFor" class="form-control" required>
              <option value="">— Select Event —</option>
              <option *ngFor="let e of events" [value]="e">{{ e }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Subject (Email)</label>
            <input type="text" [(ngModel)]="form.subject" name="subject" class="form-control" />
          </div>
        </div>
        <div class="form-group">
          <label>Email Body</label>
          <textarea [(ngModel)]="form.emailBody" name="emailBody" class="form-control" rows="4"
            placeholder="Use {variable_name} placeholders"></textarea>
        </div>
        <div class="form-group">
          <label>SMS Body</label>
          <textarea [(ngModel)]="form.smsBody" name="smsBody" class="form-control" rows="3"
            placeholder="Short SMS message"></textarea>
        </div>
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" [(ngModel)]="form.autoSend" name="autoSend" />
            Auto-send on event trigger
          </label>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving">
            {{ saving ? 'Saving...' : (editId ? 'Update' : 'Save') }}
          </button>
          <button type="button" class="btn btn-secondary" (click)="cancelEdit()">Cancel</button>
        </div>
        <div class="error-message" *ngIf="error">{{ error }}</div>
      </form>

      <div class="table-container" style="margin-top:16px">
        <table class="data-table" *ngIf="templates.length > 0; else empty">
          <thead>
            <tr>
              <th>Event</th>
              <th>Subject</th>
              <th>Has Email</th>
              <th>Has SMS</th>
              <th>Auto-send</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of templates">
              <td>{{ t.templateFor }}</td>
              <td>{{ t.subject || '—' }}</td>
              <td>{{ t.emailBody ? 'Yes' : 'No' }}</td>
              <td>{{ t.smsBody ? 'Yes' : 'No' }}</td>
              <td>
                <span [class]="t.autoSend ? 'badge-active' : 'badge-inactive'">
                  {{ t.autoSend ? 'Yes' : 'No' }}
                </span>
              </td>
              <td>
                <button class="action-link" (click)="startEdit(t)">Edit</button>
                <button class="action-link danger" (click)="remove(t.id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
        <ng-template #empty>
          <p class="empty-state">No notification templates defined yet.</p>
        </ng-template>
      </div>
    </div>
  `,
})
export class NotificationTemplatesSettingsComponent implements OnInit {
  templates: NotificationTemplate[] = [];
  events = TEMPLATE_EVENTS;
  showForm = false;
  saving = false;
  error = '';
  editId: number | null = null;

  form: CreateNotificationTemplateDto = { templateFor: '', autoSend: false };

  constructor(private service: NotificationTemplatesService, private dialog: MatDialog) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.service.getAll().subscribe({
      next: (data) => (this.templates = data),
      error: () => (this.error = 'Failed to load notification templates'),
    });
  }

  save() {
    this.saving = true;
    this.error = '';
    const req = this.editId
      ? this.service.update(this.editId, this.form)
      : this.service.create(this.form);

    req.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.saving = false;
        this.error = 'Failed to save template';
      },
    });
  }

  startEdit(t: NotificationTemplate) {
    this.editId = t.id;
    this.form = {
      templateFor: t.templateFor,
      subject: t.subject,
      emailBody: t.emailBody,
      smsBody: t.smsBody,
      autoSend: t.autoSend,
    };
    this.showForm = true;
  }

  cancelEdit() {
    this.editId = null;
    this.form = { templateFor: '', autoSend: false };
  }

  remove(id: number) {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Template', message: 'Delete this notification template?' },
      width: '400px',
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.service.delete(id).subscribe({ next: () => this.load() });
    });
  }
}
