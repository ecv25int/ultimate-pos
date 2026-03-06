import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  loading = false;
  user: any;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group(
      {
        currentPassword: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (response) => {
        this.user = response;
        this.profileForm.patchValue({
          firstName: response.firstName || '',
          lastName: response.lastName || '',
          email: response.email || '',
        });
      },
      error: (error) => {
        this.snackBar.open('Failed to load profile', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService
      .updateProfile(this.profileForm.value)
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.snackBar.open(response.message || 'Profile updated successfully', 'Close', {
            duration: 3000,
          });
          this.user = response.user;
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.message || 'Failed to update profile';
          this.snackBar.open(
            Array.isArray(message) ? message.join(', ') : message,
            'Close',
            { duration: 5000 }
          );
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    this.loading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService
      .changePassword({ currentPassword, newPassword })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          this.snackBar.open(response.message || 'Password changed successfully', 'Close', {
            duration: 3000,
          });
          this.passwordForm.reset();
        },
        error: (error) => {
          this.loading = false;
          const message = error.error?.message || 'Failed to change password';
          this.snackBar.open(
            Array.isArray(message) ? message.join(', ') : message,
            'Close',
            { duration: 5000 }
          );
        },
      });
  }

  private passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
}
