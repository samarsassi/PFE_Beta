import { authGuard } from '../app/Services/guard/auth.guard';
import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { KeycloakService } from '../app/Services/keycloak/keycloak.service';

class MockKeycloakService {
  keycloak: any = {
    isTokenExpired: () => false,
    tokenParsed: { resource_access: { PFE: { roles: ['ADMIN'] } } }
  };
}

describe('authGuard', () => {
  let navigateSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: (navigateSpy = jasmine.createSpy('navigate')) } },
        { provide: KeycloakService, useClass: MockKeycloakService }
      ]
    });
  });

  it('allows when role matches', () => {
    const can = (TestBed as any).runInInjectionContext(() => authGuard({ data: { roles: ['ADMIN'] } } as any, {} as any));
    expect(can).toBeTrue();
  });

  it('blocks and redirects when role missing', () => {
    const can = (TestBed as any).runInInjectionContext(() => authGuard({ data: { roles: ['USER'] } } as any, {} as any));
    expect(can).toBeFalse();
    expect(navigateSpy).toHaveBeenCalled();
  });
});


