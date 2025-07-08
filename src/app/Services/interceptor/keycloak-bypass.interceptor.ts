import { Injectable } from "@angular/core"
import type { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http"
import type { Observable } from "rxjs"

@Injectable()
export class KeycloakBypassInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Check if this is a Judge0 API request
    const isJudge0Request =
      req.url.includes("judge0-ce.p.rapidapi.com") ||
      req.url.includes("ce.judge0.com") ||
      req.url.includes("rapidapi.com")

    if (isJudge0Request) {
      console.log("INTERCEPTING Judge0 request:", req.url)
      console.log("Original headers:", req.headers.keys())

      // Create headers object, preserving Judge0 headers but removing Keycloak ones
      const headersToKeep: { [key: string]: string } = {}

      // Keep only the headers we want for Judge0
      const allowedHeaders = ["X-RapidAPI-Key", "X-RapidAPI-Host", "Content-Type"]

      allowedHeaders.forEach((headerName) => {
        if (req.headers.has(headerName)) {
          headersToKeep[headerName] = req.headers.get(headerName)!
        }
      })

      // Add any missing required headers
      if (!headersToKeep["X-RapidAPI-Key"]) {
        headersToKeep["X-RapidAPI-Key"] = "8974954d26msh9bb8f721563f676p1e5b2djsn0358f08cb744"
      }
      if (!headersToKeep["X-RapidAPI-Host"]) {
        headersToKeep["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com"
      }
      if (!headersToKeep["Content-Type"]) {
        headersToKeep["Content-Type"] = "application/json"
      }

      console.log("Cleaned headers:", Object.keys(headersToKeep))
      console.log("API Key being used:", headersToKeep["X-RapidAPI-Key"]?.substring(0, 10) + "...")

      // Clone request with ONLY the headers we want (this removes Authorization header)
      const bypassReq = req.clone({
        setHeaders: headersToKeep,
      })

      console.log("✅ Final request headers:", bypassReq.headers.keys())
      return next.handle(bypassReq)
    }

    // For all other requests, proceed normally
    return next.handle(req)
  }
}
