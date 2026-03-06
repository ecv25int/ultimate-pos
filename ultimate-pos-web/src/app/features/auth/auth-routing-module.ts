import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
    title: 'Login - Ultimate POS',
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Register - Ultimate POS',
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
    title: 'Forgot Password - Ultimate POS',
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    title: 'Reset Password - Ultimate POS',
  },
];

