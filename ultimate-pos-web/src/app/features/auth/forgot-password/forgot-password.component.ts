import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  forgotPasswordForm: FormGroup;
  isLoading = false;
  emailSent = false;

  constructor() {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched(this.forgotPasswordForm);
      return;
    }

    this.isLoading = true;
    const { email } = this.forgotPasswordForm.value;

    this.authService
      .forgotPassword(email)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.emailSent = true;
          this.snackBar.open(response.message, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['success-snackbar'],
          });

          // If we're in development, show the reset token
          if (response.resetToken) {
            console.log('Password reset token:', response.resetToken);
            this.snackBar.open(
              `DEV MODE - Token: ${response.resetToken}`,
              'Close',
              {
                duration: 10000,
                horizontalPosition: 'end',
                verticalPosition: 'top',
                panelClass: ['info-snackbar'],
              },
            );
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.snackBar.open(
            error.message || 'Failed to send reset email. Please try again.',
            'Close',
            {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
              panelClass: ['error-snackbar'],
            },
          );
        },
      });
  }

  backToLogin() {
    this.router.navigate(['/auth/login']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get email() {
    return this.forgotPasswordForm.get('email');
  }
}
