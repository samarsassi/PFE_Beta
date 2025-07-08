import { Component, type OnInit } from "@angular/core"
import { Judge0SimpleService, Language, SubmissionRequest } from "src/app/Services/fn/Judge0Service/judge0-direct.service"

@Component({
  selector: "app-code-editor",
  templateUrl: "./code-executor.component.html",
  styleUrls: ["./code-executor.component.css"],
})
export class CodeExecutorComponent implements OnInit {
  sourceCode = `print("Hello, World!")`

  stdin = ""
  selectedLanguageId = 71 // Python (easier to test)
  languages: Language[] = []

  isExecuting = false
  executionResult: any = null
  error: string | null = null
  showStdin: boolean = false;

  // Common language IDs for quick reference
  commonLanguages = [
    { id: 50, name: "C (GCC 9.2.0)" },
    { id: 54, name: "C++ (GCC 9.2.0)" },
    { id: 62, name: "Java (OpenJDK 13.0.1)" },
    { id: 71, name: "Python (3.8.1)" },
    { id: 63, name: "JavaScript (Node.js 12.14.0)" },
    { id: 68, name: "PHP (7.4.1)" },
    { id: 51, name: "C# (Mono 6.6.0.161)" },
    { id: 78, name: "Kotlin (1.3.70)" },
    { id: 72, name: "Ruby (2.7.0)" },
    { id: 73, name: "Rust (1.40.0)" },
  ]

  connectionStatus: "testing" | "connected" | "failed" = "testing"
  apiKeyConfigured = false

  constructor(private judge0Service: Judge0SimpleService) {}

  ngOnInit() {
    console.log("🚀 CodeExecutorComponent initialized with DirectService")
    this.apiKeyConfigured = this.judge0Service.isConfigured()

    if (!this.apiKeyConfigured) {
      console.error("⚠️ API Key not configured!")
      this.error = "Please configure your RapidAPI key in judge0-direct.service.ts"
      this.connectionStatus = "failed"
      this.languages = this.commonLanguages
      return
    }

    this.testApiConnection()
  }

  onCodeChange() {
  const inputPatterns = [
    /input\s*\(/i,      // Python
    /scanf\s*\(/i,      // C/C++
    /cin\s*>>/i,        // C++
    /readLine\s*\(/i,   // Java
    /gets\s*\(/i,       // C
    /read\s*\(/i        // Assembly (simplified)
  ];

  this.showStdin = inputPatterns.some(pattern => pattern.test(this.sourceCode));
}


  async testApiConnection() {
    console.log("🧪 Starting API connection test...")
    this.connectionStatus = "testing"
    this.error = null

    try {
      const response = await this.judge0Service.testConnection()
      console.log("✅ API connection successful!")
      this.connectionStatus = "connected"
      this.loadLanguages()
    } catch (error: any) {
      console.error("❌ API connection failed:", error)
      this.connectionStatus = "failed"

      if (error.message.includes("401")) {
        this.error = "❌ Invalid API Key! Please check your RapidAPI key."
      } else if (error.message.includes("403")) {
        this.error = "❌ Access forbidden! Make sure you're subscribed to Judge0 CE on RapidAPI."
      } else {
        this.error = `❌ Connection failed: ${error.message || "Unknown error"}`
      }

      // Fallback to common languages
      this.languages = this.commonLanguages
    }
  }

  async loadLanguages() {
    try {
      const languages = await this.judge0Service.getLanguages()
      console.log("📚 Languages loaded:", languages.length)
      this.languages = languages
    } catch (error) {
      console.error("❌ Error loading languages:", error)
      this.languages = this.commonLanguages
    }
  }

  async executeCode() {
    if (!this.sourceCode.trim()) {
      this.error = "Please enter some code to execute"
      return
    }

    console.log("🎯 Starting code execution...")
    this.isExecuting = true
    this.executionResult = null
    this.error = null

    const submission: SubmissionRequest = {
      source_code: this.sourceCode,
      language_id: this.selectedLanguageId,
      stdin: this.stdin || undefined,
    }

    try {
      const result = await this.judge0Service.submitAndWaitForResult(submission)
      console.log("🏁 Execution completed:", result)
      this.executionResult = result
      this.isExecuting = false
    } catch (error: any) {
      console.error("💥 Execution failed:", error)
      this.error = "Error executing code: " + (error.message || "Unknown error")
      this.isExecuting = false
    }
  }

  async runQuickTest() {
    console.log("🧪 Running quick test...")
    try {
      const result = await this.judge0Service.quickTest()
      console.log("✅ Quick test successful:", result)
      this.executionResult = result
    } catch (error: any) {
      console.error("❌ Quick test failed:", error)
      this.error = "Quick test failed: " + error.message
    }
  }

  onLanguageChange() {
    // Update sample code based on selected language
    const sampleCodes: { [key: number]: string } = {
      50: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
      54: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
      62: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      71: `print("Hello, World!")`,
      63: `console.log("Hello, World!");`,
      68: `<?php
echo "Hello, World!";
?>`,
      51: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, World!");
    }
}`,
      78: `fun main() {
    println("Hello, World!")
}`,
      72: `puts "Hello, World!"`,
      73: `fn main() {
    println!("Hello, World!");
}`,
    }

    if (sampleCodes[this.selectedLanguageId]) {
      this.sourceCode = sampleCodes[this.selectedLanguageId]
    }
  }

  clearOutput() {
    this.executionResult = null
    this.error = null
  }

  getStatusColor(statusId: number): string {
    switch (statusId) {
      case 3:
        return "text-green-600" // Accepted
      case 4:
        return "text-red-600" // Wrong Answer
      case 5:
        return "text-yellow-600" // Time Limit Exceeded
      case 6:
        return "text-red-600" // Compilation Error
      case 7:
        return "text-red-600" // Runtime Error (SIGSEGV)
      case 8:
        return "text-red-600" // Runtime Error (SIGXFSZ)
      case 9:
        return "text-red-600" // Runtime Error (SIGFPE)
      case 10:
        return "text-red-600" // Runtime Error (SIGABRT)
      case 11:
        return "text-red-600" // Runtime Error (NZEC)
      case 12:
        return "text-red-600" // Runtime Error (Internal Error)
      case 14:
        return "text-red-600" // Runtime Error (Exec Format Error)
      default:
        return "text-blue-600" // Processing/In Queue
    }
  }
}
