import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type StrengthLevel = 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';

interface StrengthInfo {
  score: number; // 0-4 (number of filled bars)
  label: string;
  level: StrengthLevel;
}

function computeStrength(password: string): StrengthInfo {
  if (!password) {
    return { score: 0, label: '', level: 'very-weak' };
  }

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password), // special character
  ];
  const passed = checks.filter(Boolean).length;

  if (passed <= 1) return { score: 1, label: 'Very Weak', level: 'very-weak' };
  if (passed === 2) return { score: 2, label: 'Weak', level: 'weak' };
  if (passed === 3) return { score: 3, label: 'Fair', level: 'fair' };
  if (passed === 4) return { score: 4, label: 'Strong', level: 'strong' };
  return { score: 4, label: 'Very Strong', level: 'very-strong' };
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (password) {
      <div class="strength-container" aria-live="polite">
        <div class="bars">
          @for (bar of bars; track bar.index) {
            <div
              class="bar"
              [class]="bar.index < strength.score ? 'bar--filled bar--' + strength.level : ''"
            ></div>
          }
        </div>
        <span class="strength-label" [class]="'label--' + strength.level">
          {{ strength.label }}
        </span>
      </div>
    }
  `,
  styles: [`
    .strength-container {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      margin-bottom: 4px;
    }

    .bars {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    .bar {
      height: 4px;
      flex: 1;
      border-radius: 2px;
      background: #e0e0e0;
      transition: background-color 0.3s ease;
    }

    .bar--filled.bar--very-weak  { background-color: #f44336; }
    .bar--filled.bar--weak       { background-color: #ff9800; }
    .bar--filled.bar--fair       { background-color: #ffc107; }
    .bar--filled.bar--strong     { background-color: #4caf50; }
    .bar--filled.bar--very-strong{ background-color: #2e7d32; }

    .strength-label {
      font-size: 11px;
      font-weight: 600;
      min-width: 64px;
      text-align: right;
    }

    .label--very-weak  { color: #f44336; }
    .label--weak       { color: #ff9800; }
    .label--fair       { color: #ffc107; }
    .label--strong     { color: #4caf50; }
    .label--very-strong{ color: #2e7d32; }
  `],
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password = '';

  strength: StrengthInfo = { score: 0, label: '', level: 'very-weak' };
  bars = [{ index: 0 }, { index: 1 }, { index: 2 }, { index: 3 }];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['password']) {
      this.strength = computeStrength(this.password);
    }
  }
}
