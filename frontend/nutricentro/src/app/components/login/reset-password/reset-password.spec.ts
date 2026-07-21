import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let fixture: ComponentFixture<ResetPassword>;
  let component: ResetPassword;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('does not submit without token', () => {
    component.form.setValue({ newPassword: 'Password1', confirmPassword: 'Password1' });

    component.submit();

    httpMock.expectNone('/api/v1/auth/password/reset');
    expect(component.loading).toBeFalse();
    expect(component.completed).toBeFalse();
  });

  it('does not submit when confirmation differs', () => {
    (component as unknown as { token: string }).token = 'valid-token';
    component.form.setValue({ newPassword: 'Password1', confirmPassword: 'Password2' });

    component.submit();

    httpMock.expectNone('/api/v1/auth/password/reset');
    expect(component.form.touched).toBeTrue();
    expect(component.loading).toBeFalse();
  });
});
