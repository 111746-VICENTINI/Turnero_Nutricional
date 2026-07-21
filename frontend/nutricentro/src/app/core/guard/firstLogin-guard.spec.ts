import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstLoginGuard } from './firstLogin-guard';

describe('firstLoginGuard', () => {
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
      ],
    });
  });

  afterEach(() => localStorage.clear());

  const runGuard = () => TestBed.runInInjectionContext(() =>
    firstLoginGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
  );

  it('redirects legacy first login token to create password and clears storage', () => {
    localStorage.setItem('first_login_token', 'legacy-token');

    const result = runGuard();

    expect(result).toBeFalse();
    expect(localStorage.getItem('first_login_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/create-password'], { queryParams: { token: 'legacy-token' } });
  });

  it('allows activation when there is no legacy token', () => {
    const result = runGuard();

    expect(result).toBeTrue();
  });
});
