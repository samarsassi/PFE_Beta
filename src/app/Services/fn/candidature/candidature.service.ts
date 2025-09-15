import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { Candidature } from 'src/app/Data/Candidature';
import { KeycloakService } from '../../keycloak/keycloak.service';
import { CodingChallenge } from 'src/app/Data/coding-challenge.model';

@Injectable({
  providedIn: 'root'
})
export class CandidatureService {
  private apiUrl = 'http://localhost:8089/candidatures';

  private candidaturesSubject = new BehaviorSubject<Candidature[]>([]);
  public candidatures$ = this.candidaturesSubject.asObservable();
  constructor(private http: HttpClient, private keycloakService: KeycloakService) { }


  getAllCandidatures(page = 0, size = 10, sortBy = "id", sortDir = "asc"): Observable<any> {
    const params = new HttpParams()
      .set("page", page.toString())
      .set("size", size.toString())
      .set("sortBy", sortBy)
      .set("sortDir", sortDir)

    console.log("Service: Making request with params:", params.toString())

    return this.http.get<any>(this.apiUrl, { params })
  }

  // Get all candidatures
  getAllCandidaturesList(): Observable<Candidature[]> {
    const token = this.keycloakService.keycloak.token; // Get Keycloak token

    if (!token) {
      console.error("User is not authenticated!");
      throw new Error("User is not authenticated!");
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<Candidature[]>(`${this.apiUrl}/ListCandidature`, { headers });
  }


  getCandidatureById(id: number): Observable<Candidature> {
    if (!id || isNaN(id)) {
      return throwError(() => new Error('Invalid candidature ID'));
    }
    return this.http.get<Candidature>(`${this.apiUrl}/${id}`);
  }

  getChallenge(id: string): Observable<CodingChallenge> {
    return this.http.get<CodingChallenge>(`${this.apiUrl}/${id}/challenge`);
  }

  // Create a new candidature
  createCandidature(formData: FormData): Observable<Candidature> {
    const token = this.keycloakService.keycloak.token;

    if (!token) {
      console.error("User is not authenticated!");
      return throwError(() => new Error("User is not authenticated!"));
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
      // Don't set Content-Type manually for FormData
    });

    return this.http.post<Candidature>(this.apiUrl, formData, { headers });
  }

  // Update an existing candidature
  updateCandidature(id: number, candidature: Candidature): Observable<Candidature> {
    return this.http.put<Candidature>(`${this.apiUrl}/${id}`, candidature);
  }

  submitChallenge(candidatureId: number, payload: { code: string; langage: string; resultatsExecution: string; score: number; pointsTotal: number; }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${candidatureId}/submit-challenge`, payload);
  }

  // Delete a candidature
  deleteCandidature(id: number): Observable<String> {
    return this.http.delete(`${this.apiUrl}/${id}`, { responseType: 'text' });
  }


  // method to get current candidatures value safely (optional)
  get candidaturesValue(): Candidature[] {
    return this.candidaturesSubject.getValue();
  }

  // method to update candidatures safely
  updateCandidatures(candidatures: Candidature[]) {
    this.candidaturesSubject.next(candidatures);
  }
reanalyzeCandidature(id: number, mode: 'scoreOnly' | 'fullProcess' = 'scoreOnly'): Observable<Candidature> {
  return this.http.post<Candidature>(`${this.apiUrl}/${id}/reanalyze`, {}, { params: { mode } });
}


}
