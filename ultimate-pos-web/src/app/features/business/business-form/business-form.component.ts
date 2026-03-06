import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { BusinessService } from '../../../core/services/business.service';

@Component({
  selector: 'app-business-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  template: `
    <div class="business-form-container">
      <mat-card>
        <mat-card-header>
          <button mat-icon-button routerLink="/business" class="back-button">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <mat-card-title>
            {{ isEditMode ? 'Edit Business' : 'Create New Business' }}
          </mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="businessForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Business Name</mat-label>
                <input matInput formControlName="name" required />
                <mat-error *ngIf="businessForm.get('name')?.hasError('required')">
                  Business name is required
                </mat-error>
                <mat-error *ngIf="businessForm.get('name')?.hasError('minlength')">
                  Name must be at least 2 characters
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Currency</mat-label>
                <mat-select formControlName="currency">
                  <mat-option value="USD">USD - US Dollar</mat-option>
                  <mat-option value="EUR">EUR - Euro</mat-option>
                  <mat-option value="GBP">GBP - British Pound</mat-option>
                  <mat-option value="JPY">JPY - Japanese Yen</mat-option>
                  <mat-option value="INR">INR - Indian Rupee</mat-option>
                  <mat-option value="CAD">CAD - Canadian Dollar</mat-option>
                  <mat-option value="AUD">AUD - Australian Dollar</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Timezone</mat-label>
                <mat-select formControlName="timezone">
                  <mat-option value="UTC">UTC</mat-option>
                  <mat-option value="America/New_York">Eastern Time (US)</mat-option>
                  <mat-option value="America/Chicago">Central Time (US)</mat-option>
                  <mat-option value="America/Denver">Mountain Time (US)</mat-option>
                  <mat-option value="America/Los_Angeles">Pacific Time (US)</mat-option>
                  <mat-option value="Europe/London">London</mat-option>
                  <mat-option value="Europe/Paris">Paris</mat-option>
                  <mat-option value="Asia/Tokyo">Tokyo</mat-option>
                  <mat-option value="Asia/Kolkata">India</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" />
                <mat-error *ngIf="businessForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Phone</mat-label>
                <input matInput formControlName="phone" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Country</mat-label>
                <input matInput formControlName="country" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>State/Province</mat-label>
                <input matInput formControlName="state" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>City</mat-label>
                <input matInput formControlName="city" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Zip Code</mat-label>
                <input matInput formControlName="zipCode" />
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Address</mat-label>
                <textarea matInput formControlName="address" rows="3"></textarea>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Website</mat-label>
                <input matInput formControlName="website" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Tax Number</mat-label>
                <input matInput formControlName="taxNumber" />
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button
                mat-raised-button
                type="button"
                routerLink="/business"
                class="cancel-button"
              >
                Cancel
              </button>
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="businessForm.invalid || loading"
              >
                {{ loading ? 'Saving...' : (isEditMode ? 'Update' : 'Create') }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .business-form-container {
        padding: 2rem;
        max-width: 900px;
        margin: 0 auto;
      }

      mat-card {
        padding: 1.5rem;
      }

      mat-card-header {
        display: flex;
        align-items: center;
        margin-bottom: 2rem;

        .back-button {
          margin-right: 1rem;
        }
      }

      .form-row {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
      }

      .full-width {
        width: 100%;
      }

      .half-width {
        width: calc(50% - 0.5rem);
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
      }

      .cancel-button {
        background-color: #f5f5f5;
      }

      @media (max-width: 768px) {
        .business-form-container {
          padding: 1rem;
        }

        .form-row {
          flex-direction: column;
        }

        .half-width {
          width: 100%;
        }
      }
    `,
  ],
})
export class BusinessFormComponent implements OnInit {
  businessForm: FormGroup;
  isEditMode = false;
  businessId: number | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private businessService: BusinessService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.businessForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      currency: ['USD'],
      timezone: ['UTC'],
      email: ['', Validators.email],
      phone: [''],
      country: [''],
      state: [''],
      city: [''],
      zipCode: [''],
      address: [''],
      website: [''],
      taxNumber: [''],
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.businessId = +params['id'];
        this.loadBusiness(this.businessId);
      }
    });
  }

  loadBusiness(id: number): void {
    this.businessService.getBusinessById(id).subscribe({
      next: (business) => {
        this.businessForm.patchValue(business);
      },
      error: (error) => {
        this.snackBar.open('Failed to load business', 'Close', {
          duration: 3000,
        });
        this.router.navigate(['/business']);
      },
    });
  }

  onSubmit(): void {
    if (this.businessForm.invalid) {
      return;
    }

    this.loading = true;
    const businessData = this.businessForm.value;

    const request = this.isEditMode && this.businessId
      ? this.businessService.updateBusiness(this.businessId, businessData)
      : this.businessService.createBusiness(businessData);

    request.subscribe({
      next: () => {
        this.snackBar.open(
          `Business ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.router.navigate(['/business']);
      },
      error: (error) => {
        this.loading = false;
        const message = error.error?.message || 'An error occurred';
        this.snackBar.open(
          Array.isArray(message) ? message.join(', ') : message,
          'Close',
          { duration: 5000 }
        );
      },
    });
  }
}
