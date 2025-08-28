import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private apiUrl = 'http://localhost:8089/api/workflows';
  constructor(private http: HttpClient) {}


  getAvailableDelegates(): Observable<Map<string, string>> {
    return this.http.get<Map<string, string>>(`${this.apiUrl}/delegates`);
  }
  
  deploy(xml: string) {
    return this.http.post('http://localhost:8089/api/workflows/deploy', xml, { headers: { 'Content-Type': 'application/xml' } });
  }
getHistoryVersions(): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/history`);
}

getHistoryVersionXml(filename: string): Observable<string> {
  return this.http.get(`${this.apiUrl}/history/${filename}`, { responseType: 'text' });
}



deployHistoryVersion(fileName: string): Observable<string> {
  return this.http.post('http://localhost:8089/api/workflows/history/deploy', { fileName }, { responseType: 'text' });
}
}
