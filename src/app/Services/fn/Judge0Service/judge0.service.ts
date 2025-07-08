import { HttpContext, HttpHeaders, HttpClient, HttpErrorResponse } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { type Observable, interval, switchMap, takeWhile, map, catchError, throwError } from "rxjs"

export interface SubmissionRequest {
  source_code: string
  language_id: number
  stdin?: string
  expected_output?: string
}

export interface SubmissionResponse {
  token: string
}

export interface SubmissionResult {
  stdout: string | null
  time: string | null
  memory: number | null
  stderr: string | null
  token: string
  compile_output: string | null
  message: string | null
  status: {
    id: number
    description: string
  }
}

export interface Language {
  id: number
  name: string
}

// Create a context token to bypass Keycloak interceptors
export const BYPASS_KEYCLOAK = new HttpContext().set("BYPASS_KEYCLOAK" as any, true)

@Injectable({
  providedIn: "root",
})
export class Judge0Service {
  private readonly baseUrl = "https://judge0-ce.p.rapidapi.com"
  private readonly apiKey = "8974954d26msh9bb8f721563f676p1e5b2djsn0358f08cb744" // Replace with your key

  private get headers() {
    return new HttpHeaders({
      "X-RapidAPI-Key": this.apiKey,
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    })
  }

  constructor(private http: HttpClient) {
    console.log("🔧 Judge0Service initialized")
    console.log("🔑 API Key (first 10 chars):", this.apiKey.substring(0, 10) + "...")
    console.log("🌐 Base URL:", this.baseUrl)
    console.log("🛡️ Keycloak bypass enabled for Judge0 requests")
  }

  // Base64 encoding helper functions
  private base64Encode(str: string): string {
    try {
      return btoa(unescape(encodeURIComponent(str)))
    } catch (error) {
      console.error("Base64 encode error:", error)
      return str
    }
  }

  private base64Decode(str: string): string {
    try {
      return decodeURIComponent(escape(atob(str)))
    } catch (error) {
      console.error("Base64 decode error:", error)
      return str
    }
  }

  // Enhanced error handling
  private handleError(error: HttpErrorResponse, context = ""): Observable<never> {
    console.error(`❌ ${context} Error:`, {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      error: error.error,
      headers: error.headers?.keys(),
    })

    // Check if this might be a Keycloak-related error
    if (error.status === 401) {
      console.warn("🛡️ 401 Error - This might be caused by Keycloak interceptor!")
      console.warn("🔍 Check if Keycloak is intercepting Judge0 API calls")
    }

    let errorMessage = "Unknown error occurred"

    switch (error.status) {
      case 0:
        errorMessage = "Network error - check your internet connection or CORS settings"
        break
      case 401:
        errorMessage = "❌ 401 Unauthorized - Possible Keycloak interference or invalid API key"
        break
      case 403:
        errorMessage = "❌ 403 Forbidden - Access denied or Keycloak blocking request"
        break
      case 429:
        errorMessage = "❌ 429 Rate Limited - Too many requests"
        break
      case 500:
        errorMessage = "❌ 500 Server Error - Judge0 service temporarily down"
        break
      default:
        errorMessage = `❌ HTTP ${error.status}: ${error.statusText || "Unknown error"}`
    }

    return throwError(() => new Error(errorMessage))
  }

  // Test API connection with Keycloak bypass
  testConnection(): Observable<any> {
    console.log("🧪 Testing API connection with Keycloak bypass...")

    const testUrl = `${this.baseUrl}/languages?limit=5`
    console.log("📍 Test URL:", testUrl)

    // Try with Keycloak bypass context
    return this.http
      .get(testUrl, {
        headers: this.headers,
        context: BYPASS_KEYCLOAK, // This should bypass Keycloak interceptors
        observe: "response",
      })
      .pipe(
        map((response) => {
          console.log("✅ API Connection successful with Keycloak bypass!")
          console.log("📊 Response status:", response.status)
          console.log("📦 Response body:", response.body)
          return response.body
        }),
        catchError((error) => {
          console.log("❌ Failed with Keycloak bypass, trying without context...")

          // Fallback: try without any special context
          return this.http.get(testUrl, { headers: this.headers, observe: "response" }).pipe(
            map((response) => {
              console.log("✅ API Connection successful without context!")
              return response.body
            }),
            catchError((secondError) => this.handleError(secondError, "Connection Test")),
          )
        }),
      )
  }

  // Get available programming languages
  getLanguages(): Observable<Language[]> {
    console.log("📚 Fetching languages...")

    return this.http
      .get<Language[]>(`${this.baseUrl}/languages`, {
        headers: this.headers,
        context: BYPASS_KEYCLOAK,
      })
      .pipe(
        map((languages) => {
          console.log("✅ Languages fetched:", languages.length)
          return languages
        }),
        catchError((error) => this.handleError(error, "Get Languages")),
      )
  }

  // Submit code for execution
  submitCode(submission: SubmissionRequest): Observable<SubmissionResponse> {
    console.log("🚀 Submitting code...")

    const encodedSubmission = {
      language_id: submission.language_id,
      source_code: this.base64Encode(submission.source_code),
      stdin: submission.stdin ? this.base64Encode(submission.stdin) : undefined,
    }

    const submitUrl = `${this.baseUrl}/submissions?base64_encoded=true&wait=false&fields=*`

    return this.http
      .post<SubmissionResponse>(submitUrl, encodedSubmission, {
        headers: this.headers,
        context: BYPASS_KEYCLOAK, // Bypass Keycloak for this request
        observe: "response",
      })
      .pipe(
        map((response) => {
          console.log("✅ Code submitted successfully!")
          console.log("🎫 Token:", response.body)
          return response.body!
        }),
        catchError((error) => this.handleError(error, "Submit Code")),
      )
  }

  // Get submission result by token
  getSubmissionResult(token: string): Observable<SubmissionResult> {
    const resultUrl = `${this.baseUrl}/submissions/${token}?base64_encoded=true&fields=*`

    return this.http
      .get<SubmissionResult>(resultUrl, {
        headers: this.headers,
        context: BYPASS_KEYCLOAK,
      })
      .pipe(
        map((result) => {
          console.log("📊 Status:", result.status.description, `(ID: ${result.status.id})`)

          // Decode base64 fields
          const decodedResult = {
            ...result,
            stdout: result.stdout ? this.base64Decode(result.stdout) : null,
            stderr: result.stderr ? this.base64Decode(result.stderr) : null,
            compile_output: result.compile_output ? this.base64Decode(result.compile_output) : null,
            message: result.message ? this.base64Decode(result.message) : null,
          }

          return decodedResult
        }),
        catchError((error) => this.handleError(error, "Get Result")),
      )
  }

  // Submit code and wait for result
  submitAndWaitForResult(submission: SubmissionRequest): Observable<SubmissionResult> {
    console.log("🎯 Starting code execution process...")

    return this.submitCode(submission).pipe(
      switchMap((response) => {
        console.log("✅ Submission created, polling for results...")
        let pollCount = 0

        return interval(1000).pipe(
          switchMap(() => {
            pollCount++
            console.log(`🔄 Poll attempt ${pollCount} for token: ${response.token}`)
            return this.getSubmissionResult(response.token)
          }),
          takeWhile((result) => {
            const isProcessing = result.status.id <= 2
            if (!isProcessing) {
              console.log("🏁 Final result received!")
            }
            return isProcessing
          }, true),
        )
      }),
      catchError((error) => this.handleError(error, "Execute Code")),
    )
  }

  isApiKeyConfigured(): boolean {
    return this.apiKey && this.apiKey.length > 10 && !this.apiKey.includes("YOUR_ACTUAL_API_KEY_HERE")
  }

  // Manual test method for debugging
  manualTest(): Observable<any> {
    console.log("🧪 Running manual test...")

    const testSubmission = {
      language_id: 71, // Python
      source_code: 'print("Hello from manual test!")',
      stdin: "",
    }

    console.log("📝 Test submission:", testSubmission)

    return this.submitAndWaitForResult(testSubmission).pipe(
      map((result) => {
        console.log("✅ Manual test completed!")
        console.log("📊 Result:", result)
        return result
      }),
      catchError((error) => {
        console.error("❌ Manual test failed:", error)
        return throwError(() => error)
      }),
    )
  }
}
