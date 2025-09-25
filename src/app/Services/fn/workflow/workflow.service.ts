import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private apiUrl = `${environment.apiUrl}/api/workflows`;
  constructor(private http: HttpClient) {}


  getAvailableDelegates(): Observable<Map<string, string>> {
    return this.http.get<Map<string, string>>(`${this.apiUrl}/delegates`);
  }
  
  deploy(xml: string) {
    return this.http.post('${this.apiUrl}/deploy', xml, { headers: { 'Content-Type': 'application/xml' } });
  }
getHistoryVersions(): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/history`);
}

getHistoryVersionXml(filename: string): Observable<string> {
  return this.http.get(`${this.apiUrl}/history/${filename}`, { responseType: 'text' });
}



deployHistoryVersion(fileName: string): Observable<string> {
  return this.http.post('${this.apiUrl}/history/deploy', { fileName }, { responseType: 'text' });
}
}