import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { OffreEmploi } from 'src/app/Data/OffreEmploi';
import { KeycloakService } from '../../keycloak/keycloak.service';
import { Candidature } from 'src/app/Data/Candidature';

@Injectable({
  providedIn: 'root'
})
export class OffreEmploiService {
  private apiUrl = 'http://localhost:8089/offres-emploi'; 

  constructor(private http: HttpClient, private keycloakService: KeycloakService) {}

  // Get all job offers
  getAllOffres(): Observable<OffreEmploi[]> {
    const token = this.keycloakService.keycloak.token; // Get Keycloak token
    
    if (!token) {
      console.error("User is not authenticated!");
      throw new Error("User is not authenticated!");
    }
    
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<OffreEmploi[]>(`${this.apiUrl}/OffresEmplois`, { headers });
  }

  // Get a single job offer by ID
  getOffreById(id: number): Observable<OffreEmploi> {
    return this.http.get<OffreEmploi>(`${this.apiUrl}/${id}`);
  }
  
  getCandidaturesForOffre(id: number): Observable<Candidature[]> {
  return this.http.get<Candidature[]>(`${this.apiUrl}/${id}/candidatures`);
}

  // Create a new job offer
  createOffre(offre: OffreEmploi): Observable<OffreEmploi> {
    const token = this.keycloakService.keycloak.token;
  
    if (!token) {
      console.error("User is not authenticated!");
      return throwError(() => new Error("User is not authenticated!"));
    }
  
    const headers = {
      Authorization: `Bearer ${token}`
    };
    console.log("Token:", this.keycloakService.keycloak.token);

  
    return this.http.post<OffreEmploi>(this.apiUrl, offre, { headers });
  }
  

  updateOffre(id: number, offre: OffreEmploi): Observable<OffreEmploi> {
    const token = this.keycloakService.keycloak.token;

    if (!token) {
      console.error("User is not authenticated!")
      return throwError(() => new Error("User is not authenticated!"));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.put<OffreEmploi>(`${this.apiUrl}/${id}`, offre, { headers });
  }


  // Delete a job offer
  deleteOffre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
