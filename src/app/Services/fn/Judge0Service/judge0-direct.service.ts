import { Injectable } from "@angular/core"

export interface SubmissionRequest {
  source_code: string
  language_id: number
  stdin?: string
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

@Injectable({
  providedIn: "root",
})
export class Judge0SimpleService {
  private readonly baseUrl = "https://judge0-ce.p.rapidapi.com"
  private readonly apiKey = "8974954d26msh9bb8f721563f676p1e5b2djsn0358f08cb744"

  constructor() {
    console.log("🔧 Judge0SimpleService initialized")
    console.log("🔑 Using API key:", this.apiKey.substring(0, 15) + "...")
  }

  // Use native fetch to completely bypass Angular's HTTP interceptors
  private async makeRequest<T>(method: "GET" | "POST", url: string, body?: any): Promise<T> {
    console.log(`🌐 Making ${method} request to:`, url)

    const headers: Record<string, string> = {
      "X-RapidAPI-Key": this.apiKey,
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    }

    console.log("📋 Request headers:", {
      "X-RapidAPI-Key": this.apiKey.substring(0, 10) + "...",
      "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    })

    const options: RequestInit = {
      method,
      headers,
      mode: "cors",
    }

    if (method === "POST" && body) {
      options.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, options)

      console.log("📊 Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Response error:", errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("✅ Response received successfully")
      return data as T
    } catch (error) {
      console.error("❌ Fetch error:", error)
      throw error
    }
  }

  // Test connection
  async testConnection(): Promise<any> {
    console.log("🧪 Testing connection with native fetch...")
    return this.makeRequest<any>("GET", `${this.baseUrl}/languages?limit=5`)
  }

  // Get languages
  async getLanguages(): Promise<Language[]> {
    console.log("📚 Fetching languages...")
    return this.makeRequest<Language[]>("GET", `${this.baseUrl}/languages`)
  }

  // Submit code
  async submitCode(submission: SubmissionRequest): Promise<SubmissionResponse> {
    console.log("🚀 Submitting code...")

    const encodedSubmission = {
      language_id: submission.language_id,
      source_code: btoa(submission.source_code),
      stdin: submission.stdin ? btoa(submission.stdin) : "",
    }

    const url = `${this.baseUrl}/submissions?base64_encoded=true&wait=false&fields=*`
    return this.makeRequest<SubmissionResponse>("POST", url, encodedSubmission)
  }

  // Get submission result
  async getSubmissionResult(token: string): Promise<SubmissionResult> {
    const url = `${this.baseUrl}/submissions/${token}?base64_encoded=true&fields=*`
    const result = await this.makeRequest<SubmissionResult>("GET", url)

    // Decode base64 fields
    return {
      ...result,
      stdout: result.stdout ? atob(result.stdout) : null,
      stderr: result.stderr ? atob(result.stderr) : null,
      compile_output: result.compile_output ? atob(result.compile_output) : null,
      message: result.message ? atob(result.message) : null,
    }
  }

  // Submit and wait for result
  async submitAndWaitForResult(submission: SubmissionRequest): Promise<SubmissionResult> {
    console.log("🎯 Starting execution process...")

    const response = await this.submitCode(submission)
    console.log("✅ Code submitted, token:", response.token)

    // Poll for result
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++

      console.log(`🔄 Poll attempt ${attempts}/${maxAttempts}`)
      const result = await this.getSubmissionResult(response.token)

      console.log("📊 Status:", result.status.description, `(ID: ${result.status.id})`)

      if (result.status.id > 2) {
        console.log("🏁 Execution completed!")
        return result
      }
    }

    throw new Error("Execution timeout")
  }

  // Quick test
  async quickTest(): Promise<any> {
    console.log("🧪 Running quick test...")

    const testCode = {
      language_id: 71, // Python
      source_code: 'print("Hello from Judge0!")',
      stdin: "",
    }

    return this.submitAndWaitForResult(testCode)
  }

  isConfigured(): boolean {
    return this.apiKey.length > 10
  }
}
