import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { LoginForm } from './login-form';

describe('LoginForm', () => {
  let fixture: ComponentFixture<LoginForm>;
  let component: LoginForm;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('uses email and password without role selector', () => {
    expect(component.loginForm.contains('email')).toBeTrue();
    expect(component.loginForm.contains('password')).toBeTrue();
    expect(component.loginForm.contains('role')).toBeFalse();
  });

  it('validates email format', () => {
    component.loginForm.controls.email.setValue('not-an-email');

    expect(component.loginForm.controls.email.valid).toBeFalse();

    component.loginForm.controls.email.setValue('user@test.com');

    expect(component.loginForm.controls.email.valid).toBeTrue();
  });
});
