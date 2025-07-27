import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Entretien } from 'src/app/Data/Entretien';

@Injectable({
  providedIn: 'root'
})
export class EntretienService {

 
  private baseUrl = 'http://localhost:8089/entretiens'; // Adjust to your actual API endpoint
 
   constructor(private http: HttpClient) {}
   getAllChallenges(): Observable<Entretien[]> {
     return this.http.get<Entretien[]>(this.baseUrl);
   }
 
   createEntretien(Entretien: Partial<Entretien>): Observable<Entretien> {
     console.log("Sending test case to backend:", Entretien);
     return this.http.post<Entretien>(this.baseUrl, Entretien);
   }
 
   updateEntretien(EntretienId: number, updates: Partial<Entretien>): Observable<Entretien> {
     return this.http.put<Entretien>(`${this.baseUrl}/${EntretienId}`, updates);
   }
 
   deleteEntretien(EntretienId: number): Observable<void> {
     return this.http.delete<void>(`${this.baseUrl}/${EntretienId}`);
   }
}
