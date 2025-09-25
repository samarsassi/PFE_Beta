import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChallengeService } from './challenge-service.service';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(ChallengeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should GET all challenges', () => {
    const mock = [{ id: 1 }];
    service.getAllChallenges().subscribe(r => {
      expect(r).toEqual(mock as any);
    });
    const req = httpMock.expectOne(r => r.method === 'GET' && r.url.endsWith('/challenges'));
    req.flush(mock);
  });
});
