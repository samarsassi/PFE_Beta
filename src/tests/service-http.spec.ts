import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OffreEmploiService } from '../app/Services/fn/offreemploi/OffreEmploiService';
import { KeycloakService } from '../app/Services/keycloak/keycloak.service';

describe('OffreemploiService (HTTP)', () => {
  let service: OffreEmploiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OffreEmploiService,
        { provide: KeycloakService, useValue: { keycloak: { token: 'fake' } } }
      ]
    });
    service = TestBed.inject(OffreEmploiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should call GET offers endpoint', () => {
    const dummy = [{ id: 1, titre: 'Dev' }];
    service.getAllOffres().subscribe(data => {
      expect(data).toEqual(dummy as any);
    });
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.includes('/OffresEmplois'));
    req.flush(dummy);
  });
});


