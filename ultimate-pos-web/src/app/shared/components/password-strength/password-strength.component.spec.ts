import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasswordStrengthComponent } from './password-strength.component';

describe('PasswordStrengthComponent', () => {
  let component: PasswordStrengthComponent;
  let fixture: ComponentFixture<PasswordStrengthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordStrengthComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordStrengthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows nothing when password is empty', () => {
    fixture.componentRef.setInput('password', '');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.strength-container')).toBeNull();
  });

  it('shows very-weak for password with only 1 char class', () => {
    fixture.componentRef.setInput('password', 'abcde');
    fixture.detectChanges();

    expect(component.strength.level).toBe('very-weak');
    expect(component.strength.score).toBe(1);
  });

  it('computes fair for password with 3 passing checks', () => {
    fixture.componentRef.setInput('password', 'Password'); // no digit
    fixture.detectChanges();

    // length>=8 ✓, upper ✓, lower ✓ → 3 checks → fair
    expect(component.strength.level).toBe('fair');
    expect(component.strength.label).toBe('Fair');
  });

  it('computes strong for password with 4 passing checks', () => {
    fixture.componentRef.setInput('password', 'Password1');
    fixture.detectChanges();

    expect(component.strength.level).toBe('strong');
    expect(component.strength.label).toBe('Strong');
  });

  it('computes very-strong for password with all 5 checks', () => {
    fixture.componentRef.setInput('password', 'Password1!');
    fixture.detectChanges();

    expect(component.strength.level).toBe('very-strong');
    expect(component.strength.label).toBe('Very Strong');
  });

  it('renders 4 bar elements', () => {
    fixture.componentRef.setInput('password', 'Password1');
    fixture.detectChanges();

    const bars = fixture.nativeElement.querySelectorAll('.bar');
    expect(bars.length).toBe(4);
  });
});
