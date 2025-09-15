import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { KeycloakService } from '../keycloak/keycloak.service';

@Injectable()
export class HttpTokenInterceptor implements HttpInterceptor {

  constructor(private keycloakService: KeycloakService) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Automatically refresh token if expiring in <30 seconds
    return from(this.keycloakService.keycloak.updateToken(30)).pipe(
      switchMap(() => {
        const token = this.keycloakService.keycloak.token;
        if (token) {
          const authReq = request.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          });
          return next.handle(authReq);
        }
        return next.handle(request);
      })
    );
  }
}
