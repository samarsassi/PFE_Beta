import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { KeycloakService } from '../keycloak/keycloak.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  // If token expired, redirect to login
  if (keycloakService.keycloak.isTokenExpired()) {
    router.navigate(['login']);
    return false;
  }

  // Get the roles expected for the current route from the route data
  const expectedRoles = route.data['roles'] as string[] || [];
  
  // Get the roles of the current user from KeycloakService
  //const userRoles = keycloakService.keycloak?.tokenParsed?.realm_access?.roles || [];
  const userRoles = keycloakService.keycloak?.tokenParsed?.resource_access?.['PFE']?.roles || [];

  // Check if the user has any of the expected roles
  const hasRole = expectedRoles.length === 0 || expectedRoles.some(role => userRoles.includes(role));

  if (!hasRole) {
    // Redirect to the unauthorized page if the user doesn't have the required role
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
