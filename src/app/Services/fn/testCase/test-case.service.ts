import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TestCase } from 'src/app/Data/coding-challenge.model';

@Injectable({
  providedIn: 'root'
})
export class TestCaseService {

 private baseUrl = 'http://localhost:8089/testcases'; // Adjust to your actual API endpoint

  constructor(private http: HttpClient) {}

  getTestCasesByChallengeId(challengeId: number): Observable<TestCase[]> {
    return this.http.get<TestCase[]>(`${this.baseUrl}/challenge/${challengeId}`);
  }

  createTestCase(testCase: Partial<TestCase>): Observable<TestCase> {
    console.log("Sending test case to backend:", testCase);
    return this.http.post<TestCase>(this.baseUrl, testCase);
  }

  updateTestCase(testCaseId: number, updates: Partial<TestCase>): Observable<TestCase> {
    return this.http.put<TestCase>(`${this.baseUrl}/${testCaseId}`, updates);
  }

  deleteTestCase(testCaseId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${testCaseId}`);
  }
}
