import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private baseUrl = 'http://localhost:8089/stats';

  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<any>(this.baseUrl);
  }
}
