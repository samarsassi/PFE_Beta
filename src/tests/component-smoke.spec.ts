import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppComponent } from '../app/app.component';
import { KeycloakService } from '../app/Services/keycloak/keycloak.service';

class MockKeycloakService {
  get token() { return 'fake'; }
  init() { return Promise.resolve(true); }
}

describe('Component smoke', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AppComponent],
      providers: [ { provide: KeycloakService, useClass: MockKeycloakService } ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create AppComponent', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const comp = fixture.componentInstance;
    expect(comp).toBeTruthy();
  });
});


