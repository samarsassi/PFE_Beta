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
   getAllInterviews(): Observable<Entretien[]> {
     return this.http.get<Entretien[]>(this.baseUrl);
   }
 
createEntretien(candidatureId: number, entretien: Partial<Entretien>): Observable<Entretien> {
  console.log("Sending test case to backend:", entretien);
  return this.http.post<Entretien>(`${this.baseUrl}/${candidatureId}/create`, entretien);
}

 
updateEntretien(id: number, entretien: Entretien): Observable<Entretien> {
  return this.http.put<Entretien>(`${this.baseUrl}/${id}`, entretien);
}

deleteEntretien(EntretienId: number): Observable<void> {
     return this.http.delete<void>(`${this.baseUrl}/${EntretienId}`);
}
}
