import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private baseUrl = `${environment.apiUrl}/stats`;

  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<any>(this.baseUrl);
  }
}
