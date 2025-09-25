import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CodingChallenge } from 'src/app/Data/coding-challenge.model';
import { CandidatureService } from '../candidature/candidature.service';
import { Candidature } from 'src/app/Data/Candidature';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {

  private baseUrl = `${environment.apiUrl}/challenges`;

  constructor(private http: HttpClient, private candidatureService: CandidatureService) { }

  getAllChallenges(): Observable<CodingChallenge[]> {
    return this.http.get<CodingChallenge[]>(this.baseUrl);
  }

  getChallengeById(id: number): Observable<CodingChallenge> {
    return this.http.get<CodingChallenge>(`${this.baseUrl}/${id}`);
  }

  createChallenge(challenge: CodingChallenge): Observable<CodingChallenge> {
    return this.http.post<CodingChallenge>(this.baseUrl, challenge);
  }

  updateChallenge(id: number, challenge: CodingChallenge): Observable<CodingChallenge> {
    return this.http.put<CodingChallenge>(`${this.baseUrl}/${id}`, challenge);
  }

  deleteChallenge(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }

    getAvailableLanguages() {
    return [
      { id: 50, name: "C (GCC 9.2.0)" },
      { id: 54, name: "C++ (GCC 9.2.0)" },
      { id: 62, name: "Java (OpenJDK 13.0.1)" },
      { id: 71, name: "Python (3.8.1)" },
      { id: 63, name: "JavaScript (Node.js 12.14.0)" },
      { id: 68, name: "PHP (7.4.1)" },
      { id: 51, name: "C# (Mono 6.6.0.161)" },
      { id: 78, name: "Kotlin (1.3.70)" },
      { id: 72, name: "Ruby (2.7.0)" },
      { id: 73, name: "Rust (1.40.0)" },
    ]
  }

envoyerDefiAuCandidat(candidatureId: number, defiId: number): Observable<string> {
  return this.http.post<string>(
    `${this.baseUrl}/${candidatureId}/send-challenge/${defiId}`, 
    {}
  ).pipe(
    tap(() => {
      const candidatures = this.candidatureService.candidaturesValue;
      const index = candidatures.findIndex(c => c.id === candidatureId);
      if (index !== -1) {
        const updatedCandidature = {
          ...candidatures[index],
          statutDefi: "ENVOYE" as Candidature["statutDefi"],
          defiId,
          defiEnvoyeLe: new Date()
        };

        const updatedList = [
          ...candidatures.slice(0, index),
          updatedCandidature,
          ...candidatures.slice(index + 1)
        ];
        this.candidatureService.updateCandidatures(updatedList);
      }
    })
  );
}


  
}
