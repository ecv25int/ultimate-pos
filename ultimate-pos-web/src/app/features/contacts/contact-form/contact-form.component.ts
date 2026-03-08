import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ContactService } from '../../../core/services/contact.service';
import { CreateContactDto } from '../../../core/models/contact.model';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="form-container">
      <div class="form-header">
        <button mat-icon-button routerLink="/contacts">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <div>
          <h1>{{ isEditMode ? 'Edit Contact' : 'Add Contact' }}</h1>
          <p class="subtitle">{{ isEditMode ? 'Update contact information' : 'Add a new customer or supplier' }}</p>
        </div>
      </div>

      @if (loadingContact) {
        <div class="loading-state">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading contact...</p>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="contact-form">

          <!-- Type Selection -->
          <div class="form-section">
            <h2 class="section-title">Contact Type</h2>
            <div class="type-toggle">
              @for (t of contactTypes; track t.value) {
                <button
                  type="button"
                  class="type-btn"
                  [class.active]="form.get('type')?.value === t.value"
                  (click)="form.get('type')?.setValue(t.value)"
                >
                  <mat-icon>{{ t.icon }}</mat-icon>
                  {{ t.label }}
                </button>
              }
            </div>
            @if (form.get('type')?.invalid && form.get('type')?.touched) {
              <mat-error>Contact type is required</mat-error>
            }
          </div>

          <mat-divider></mat-divider>

          <!-- Basic Info -->
          <div class="form-section">
            <h2 class="section-title">Basic Information</h2>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Full Name *</mat-label>
                <input matInput formControlName="name" placeholder="John Doe" />
                @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
                  <mat-error>Name is required</mat-error>
                }
              </mat-form-field>

              @if (form.get('type')?.value === 'supplier' || form.get('type')?.value === 'both') {
                <mat-form-field appearance="outline">
                  <mat-label>Business Name</mat-label>
                  <input matInput formControlName="supplierBusinessName" placeholder="Acme Corp" />
                </mat-form-field>
              }

              <mat-form-field appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" type="email" placeholder="john@example.com" />
                @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                  <mat-error>Enter a valid email</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tax Number</mat-label>
                <input matInput formControlName="taxNumber" placeholder="VAT / GST number" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Position / Title</mat-label>
                <input matInput formControlName="position" placeholder="Manager" />
              </mat-form-field>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Contact Numbers -->
          <div class="form-section">
            <h2 class="section-title">Contact Numbers</h2>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Mobile *</mat-label>
                <input matInput formControlName="mobile" placeholder="+1234567890" />
                <mat-icon matPrefix>phone</mat-icon>
                @if (form.get('mobile')?.hasError('required') && form.get('mobile')?.touched) {
                  <mat-error>Mobile number is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Landline</mat-label>
                <input matInput formControlName="landline" placeholder="+1 555 000 0000" />
                <mat-icon matPrefix>local_phone</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Alternate Number</mat-label>
                <input matInput formControlName="alternateNumber" placeholder="+1 555 000 0001" />
                <mat-icon matPrefix>phone_forwarded</mat-icon>
              </mat-form-field>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Address -->
          <div class="form-section">
            <h2 class="section-title">Address</h2>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>State / Province</mat-label>
                <input matInput formControlName="state" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Country</mat-label>
                <input matInput formControlName="country" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Landmark</mat-label>
                <input matInput formControlName="landmark" placeholder="Near post office..." />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Shipping Address</mat-label>
              <textarea matInput formControlName="shippingAddress" rows="3" placeholder="Full shipping address..."></textarea>
            </mat-form-field>
          </div>

          <mat-divider></mat-divider>

          <!-- Payment Terms -->
          <div class="form-section">
            <h2 class="section-title">Payment Terms</h2>
            <div class="form-grid">
              <mat-form-field appearance="outline">
                <mat-label>Pay Term Number</mat-label>
                <input matInput formControlName="payTermNumber" type="number" min="0" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Pay Term Type</mat-label>
                <mat-select formControlName="payTermType">
                  <mat-option value="">None</mat-option>
                  <mat-option value="days">Days</mat-option>
                  <mat-option value="months">Months</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Credit Limit</mat-label>
                <input matInput formControlName="creditLimit" type="number" min="0" step="0.01" />
                <span matPrefix>$&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="contactStatus">
                  <mat-option value="active">Active</mat-option>
                  <mat-option value="inactive">Inactive</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button type="button" mat-stroked-button routerLink="/contacts">Cancel</button>
            <button type="submit" mat-raised-button color="primary" [disabled]="submitting || form.invalid">
              @if (submitting) {
                <mat-spinner diameter="20" color="accent"></mat-spinner>
              } @else {
                {{ isEditMode ? 'Save Changes' : 'Add Contact' }}
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    .form-container { padding: 1.5rem; max-width: 1400px; margin: 0 auto; }
    .form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .form-header h1 { margin: 0 0 4px; font-size: 1.75rem; font-weight: 600; color: #1a1a1a; }
    .subtitle { margin: 0; color: #666; font-size: 14px; }

    .loading-state { display: flex; flex-direction: column; align-items: center; padding: 64px; gap: 16px; color: #666; }

    .contact-form { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .form-section { padding: 24px 0; }
    .section-title { margin: 0 0 20px; font-size: 16px; font-weight: 600; color: #374151; }

    .type-toggle { display: flex; gap: 12px; }
    .type-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border: 2px solid #e5e7eb; border-radius: 8px; background: white; cursor: pointer; font-size: 14px; transition: all 0.2s; }
    .type-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .type-btn.active { border-color: #6366f1; color: #6366f1; background: #eef2ff; }
    .type-btn:hover:not(.active) { border-color: #9ca3af; }

    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    mat-form-field { width: 100%; }
    .full-width { width: 100%; margin-top: 16px; }

    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 24px; }

    mat-divider { margin: 0 !important; }

    @media (max-width: 600px) {
      .form-grid { grid-template-columns: 1fr; }
      .type-toggle { flex-wrap: wrap; }
    }
  `],
})
export class ContactFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  contactId?: number;
  submitting = false;
  loadingContact = false;

  contactTypes = [
    { value: 'customer', label: 'Customer', icon: 'person' },
    { value: 'supplier', label: 'Supplier', icon: 'local_shipping' },
    { value: 'both', label: 'Both', icon: 'people' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contactService: ContactService,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      type: ['customer', Validators.required],
      name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(255)]],
      supplierBusinessName: [''],
      email: ['', Validators.email],
      taxNumber: [''],
      mobile: ['', Validators.required],
      landline: [''],
      alternateNumber: [''],
      city: [''],
      state: [''],
      country: [''],
      landmark: [''],
      shippingAddress: [''],
      position: [''],
      payTermNumber: [null],
      payTermType: [''],
      creditLimit: [null],
      contactStatus: ['active'],
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.contactId = +id;
      this.loadContact();
    }
  }

  loadContact() {
    this.loadingContact = true;
    this.contactService.getOne(this.contactId!).subscribe({
      next: (c) => {
        this.form.patchValue({
          type: c.type,
          name: c.name,
          supplierBusinessName: c.supplierBusinessName ?? '',
          email: c.email ?? '',
          taxNumber: c.taxNumber ?? '',
          mobile: c.mobile,
          landline: c.landline ?? '',
          alternateNumber: c.alternateNumber ?? '',
          city: c.city ?? '',
          state: c.state ?? '',
          country: c.country ?? '',
          landmark: c.landmark ?? '',
          shippingAddress: c.shippingAddress ?? '',
          position: c.position ?? '',
          payTermNumber: c.payTermNumber ?? null,
          payTermType: c.payTermType ?? '',
          creditLimit: c.creditLimit ?? null,
          contactStatus: c.contactStatus,
        });
        this.loadingContact = false;
      },
      error: () => {
        this.snackBar.open('Failed to load contact', 'Close', { duration: 3000 });
        this.router.navigate(['/contacts']);
      },
    });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const v = this.form.value;

    const dto: CreateContactDto = {
      type: v.type,
      name: v.name,
      mobile: v.mobile,
      ...(v.supplierBusinessName && { supplierBusinessName: v.supplierBusinessName }),
      ...(v.email && { email: v.email }),
      ...(v.taxNumber && { taxNumber: v.taxNumber }),
      ...(v.landline && { landline: v.landline }),
      ...(v.alternateNumber && { alternateNumber: v.alternateNumber }),
      ...(v.city && { city: v.city }),
      ...(v.state && { state: v.state }),
      ...(v.country && { country: v.country }),
      ...(v.landmark && { landmark: v.landmark }),
      ...(v.shippingAddress && { shippingAddress: v.shippingAddress }),
      ...(v.position && { position: v.position }),
      ...(v.payTermNumber != null && { payTermNumber: +v.payTermNumber }),
      ...(v.payTermType && { payTermType: v.payTermType }),
      ...(v.creditLimit != null && { creditLimit: +v.creditLimit }),
      contactStatus: v.contactStatus,
    };

    const request = this.isEditMode
      ? this.contactService.update(this.contactId!, dto)
      : this.contactService.create(dto);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          this.isEditMode ? 'Contact updated' : 'Contact created',
          'Close', { duration: 2000 }
        );
        this.router.navigate(['/contacts']);
      },
      error: (err) => {
        this.snackBar.open(
          err.error?.message ?? 'An error occurred',
          'Close', { duration: 4000 }
        );
        this.submitting = false;
      },
    });
  }
}
