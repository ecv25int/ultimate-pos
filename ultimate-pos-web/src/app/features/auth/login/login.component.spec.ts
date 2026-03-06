import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form initially', () => {
    expect(component.loginForm.valid).toBe(false);
  });

  it('should have rememberMe defaulted to false', () => {
    expect(component.loginForm.get('rememberMe')?.value).toBe(false);
  });

  it('should mark form invalid when fields are empty', () => {
    component.loginForm.get('username')?.setValue('');
    component.loginForm.get('password')?.setValue('');
    expect(component.loginForm.valid).toBe(false);
  });

  it('should mark form valid when required fields are filled', () => {
    component.loginForm.get('username')?.setValue('admin');
    component.loginForm.get('password')?.setValue('password123');
    expect(component.loginForm.valid).toBe(true);
  });
});

