import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { OffreEmploi } from 'src/app/Data/OffreEmploi';
import { KeycloakService } from '../../keycloak/keycloak.service';
import { Candidature } from 'src/app/Data/Candidature';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OffreEmploiService {
  private apiUrl = `${environment.apiUrl}/offres-emploi`; 

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

 private getAuthHeaders(): HttpHeaders {
    const token = this.keycloakService.keycloak?.token;
    if (!token) {
      throw new Error('User is not authenticated!');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
      
    createOffre(offre: OffreEmploi): Observable<OffreEmploi> {
      const token = this.keycloakService.token;
      if (!token) {
        // handle unauthenticated state
        throw new Error("User not authenticated");
      }

      const headers = new HttpHeaders({
        'Content-Type': 'application/json',   // MUST be application/json
        'Authorization': `Bearer ${token}`
      });

      return this.http.post<OffreEmploi>(this.apiUrl, offre, { headers });
    }





  // Update existing OffreEmploi by ID
  updateOffre(id: number, offre: OffreEmploi): Observable<OffreEmploi> {
    const headers = this.getAuthHeaders();
    return this.http.put<OffreEmploi>(`${this.apiUrl}/${id}`, offre, { headers });
  }

  // Delete a job offer
  deleteOffre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getOffersByKeyword(keyword: string) {
    return this.http.get<any[]>(`${this.apiUrl}/offers/search?keyword=${encodeURIComponent(keyword)}`);
  }
  
  getOffersByKeyword2(keywords: string[]) {
    const joinedKeywords = keywords.join(','); // or ' ' if your backend expects spaces
    return this.http.get<any[]>(`${this.apiUrl}/search?keyword=${encodeURIComponent(joinedKeywords)}`);
  }
  
  

  
}
