import { Component, type OnInit } from "@angular/core";
import { Judge0SimpleService, Language, SubmissionRequest } from "src/app/Services/fn/Judge0Service/judge0-direct.service";
import { ActivatedRoute } from '@angular/router';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { CodingChallenge } from 'src/app/Data/coding-challenge.model';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { Location } from '@angular/common';
import { Candidature } from "src/app/Data/Candidature";
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: "app-code-editor",
  templateUrl: "./code-executor.component.html",
  styleUrls: ["./code-executor.component.css"],
})
export class CodeExecutorComponent implements OnInit {
  sourceCode = `print("Hello, World!")`;
  challengeDescription: string = '';
  selectedLanguageId = 71; // Default: Python
  candidatureId: string = '';
  candidature: Candidature | null = null;
  stdin: string = '';
  languages: Language[] = [];
  challengeTitle: string = '';
  challengeStarted = false;
  challengeExpired = false;
  remainingTime = 0; // in seconds
  timerInterval: any = null;
  challengeStartTime: number | null = null;
  tempsLimite = 0; // in minutes
  challengeTestCases: any[] = [];
  defiEnvoyeLe: Date | null = null;
  expiry48hTimeout: any = null;
  expiryReason: string | null = null;

  isExecuting = false;
  executionResult: any = null;
  error: string | null = null;
  showStdin = false;

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
  ];

  connectionStatus: "testing" | "connected" | "failed" = "testing";
  apiKeyConfigured = false;

  constructor(
    private judge0Service: Judge0SimpleService,
    private route: ActivatedRoute,
    private candidatureService: CandidatureService,
    private keycloakService: KeycloakService,
    private location: Location,
    private dialog: MatDialog
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.candidatureId = params.get('id') || '';
      if (this.candidatureId) {
        this.candidatureService.getCandidatureById(Number(this.candidatureId)).subscribe(cand => {
          this.candidature = cand;
          this.defiEnvoyeLe = cand.defiEnvoyeLe ? new Date(cand.defiEnvoyeLe) : null;

          if (this.defiEnvoyeLe) {
            const now = new Date();
            const expiryDate = new Date(this.defiEnvoyeLe.getTime() + 48 * 60 * 60 * 1000);
            const msUntilExpiry = expiryDate.getTime() - now.getTime();
            if (msUntilExpiry <= 0) {
              this.expiryReason = '48h';
              this.expireChallenge();
            } else {
              this.expiry48hTimeout = setTimeout(() => {
                this.expiryReason = '48h';
                this.expireChallenge();
              }, msUntilExpiry);
            }
          }
        });

        this.candidatureService.getChallenge(this.candidatureId).subscribe({
          next: (challenge: CodingChallenge) => {
            this.challengeTitle = challenge.titre || 'Coding Challenge';
            this.challengeDescription = challenge.description || '';
            this.sourceCode = challenge.codeDepart || '';
            this.selectedLanguageId = challenge.languageId || 71;
            this.tempsLimite = challenge.tempslimite || 0;
            this.challengeTestCases = (challenge.testCases || []).filter(tc => !tc.estCache);

            const storedStart = localStorage.getItem('challengeStartTime_' + this.candidatureId);
            if (storedStart) {
              this.challengeStartTime = parseInt(storedStart, 10);
              this.startTimerFromStored();
            }
          },
          error: () => {
            this.challengeTitle = 'Coding Challenge';
            this.challengeDescription = '';
            this.sourceCode = `print("Hello, World!")`;
            this.selectedLanguageId = 71;
            this.tempsLimite = 0;
            this.challengeTestCases = [];
          }
        });
      }
    });

    this.apiKeyConfigured = this.judge0Service.isConfigured();
    if (!this.apiKeyConfigured) {
      this.error = "Please configure your RapidAPI key in judge0-direct.service.ts";
      this.connectionStatus = "failed";
      this.languages = this.commonLanguages;
      return;
    }

    this.testApiConnection();
  }

  onCodeChange() {
    const inputPatterns = [
      /input\s*\(/i, /scanf\s*\(/i, /cin\s*>>/i,
      /readLine\s*\(/i, /gets\s*\(/i, /read\s*\(/i
    ];
    this.showStdin = inputPatterns.some(pattern => pattern.test(this.sourceCode));
  }

  async testApiConnection() {
    this.connectionStatus = "testing";
    this.error = null;

    try {
      await this.judge0Service.testConnection();
      this.connectionStatus = "connected";
      this.loadLanguages();
    } catch (error: any) {
      this.connectionStatus = "failed";
      this.error = error.message.includes("401")
        ? "❌ Invalid API Key! Please check your RapidAPI key."
        : error.message.includes("403")
          ? "❌ Access forbidden! Make sure you're subscribed to Judge0 CE on RapidAPI."
          : `❌ Connection failed: ${error.message || "Unknown error"}`;
      this.languages = this.commonLanguages;
    }
  }

  async loadLanguages() {
    try {
      this.languages = await this.judge0Service.getLanguages();
    } catch {
      this.languages = this.commonLanguages;
    }
  }

  async executeCode() {
    if (!this.sourceCode.trim()) {
      this.error = "Please enter some code to execute";
      return;
    }

    this.isExecuting = true;
    this.executionResult = null;
    this.error = null;

    const submission: SubmissionRequest = {
      source_code: this.sourceCode,
      language_id: this.selectedLanguageId,
      stdin: this.stdin || undefined,
    };

    try {
      this.executionResult = await this.judge0Service.submitAndWaitForResult(submission);
    } catch (error: any) {
      this.error = "Error executing code: " + (error.message || "Unknown error");
    } finally {
      this.isExecuting = false;
    }
  }

  async runQuickTest() {
    try {
      this.executionResult = await this.judge0Service.quickTest();
    } catch (error: any) {
      this.error = "Quick test failed: " + error.message;
    }
  }

  onLanguageChange() {
    const sample: { [key: number]: string } = {
      50: `#include <stdio.h>\nint main() { printf("Hello, World!\\n"); return 0; }`,
      54: `#include <iostream>\nusing namespace std;\nint main() { cout << "Hello, World!" << endl; return 0; }`,
      62: `public class Main { public static void main(String[] args) { System.out.println("Hello, World!"); } }`,
      71: `print("Hello, World!")`,
      63: `console.log("Hello, World!");`,
      68: `<?php\necho "Hello, World!";\n?>`,
      51: `using System;\nclass Program { static void Main() { Console.WriteLine("Hello, World!"); } }`,
      78: `fun main() { println("Hello, World!") }`,
      72: `puts "Hello, World!"`,
      73: `fn main() { println!("Hello, World!"); }`,
    };
    if (sample[this.selectedLanguageId]) {
      this.sourceCode = sample[this.selectedLanguageId];
    }
  }

  clearOutput() {
    this.executionResult = null;
    this.error = null;
  }

  getStatusColor(statusId: number): string {
    const colors: { [key: number]: string } = {
      3: "text-green-600", 4: "text-red-600", 5: "text-yellow-600",
      6: "text-red-600", 7: "text-red-600", 8: "text-red-600",
      9: "text-red-600", 10: "text-red-600", 11: "text-red-600",
      12: "text-red-600", 14: "text-red-600"
    };
    return colors[statusId] || "text-blue-600";
  }

  startChallenge() {
    if (this.challengeStarted || this.challengeExpired) return;
    this.challengeStarted = true;
    this.remainingTime = this.tempsLimite * 60;
    this.challengeStartTime = Date.now();
    localStorage.setItem('challengeStartTime_' + this.candidatureId, this.challengeStartTime.toString());
    this.timerInterval = setInterval(() => this.updateTimer(), 1000);
  }

  startTimerFromStored() {
    this.challengeStarted = true;
    const elapsed = Math.floor((Date.now() - (this.challengeStartTime || 0)) / 1000);
    this.remainingTime = (this.tempsLimite * 60) - elapsed;
    if (this.remainingTime <= 0) {
      this.expireChallenge();
    } else {
      this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
  }

  updateTimer() {
    if (this.challengeExpired) return;
    this.remainingTime--;
    if (this.remainingTime <= 0) {
      this.remainingTime = 0; // Clamp to zero
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.expireChallenge();
    }
  }

  expireChallenge(): void {
    if (this.challengeExpired) return;
    this.challengeExpired = true;
    this.challengeStarted = false;
    this.remainingTime = 0; // Clamp to zero
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.expiry48hTimeout) {
      clearTimeout(this.expiry48hTimeout);
      this.expiry48hTimeout = null;
    }
    if (this.candidature) {
      localStorage.removeItem(`challengeStartTime_${this.candidature.id}`);
      if (this.candidature.statut !== 'REFUSEE') {
        const updatedCandidature = {
          ...this.candidature,
          statut: 'REFUSEE' as const
        };
        this.candidatureService.updateCandidature(this.candidature.id, updatedCandidature).subscribe({
          next: () => console.log(`✅ Candidature ${this.candidature?.id} set to REFUSEE`),
          error: (err) => console.error("❌ Failed to update candidature:", err),
        });

      } else {
        console.log(`ℹ️ Candidature ${this.candidature?.id} already REFUSEE`);
      }
    }
    console.log('Challenge expired, UI should be blocked.');
  }

  formatTime(seconds: number): string {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  isAdmin(): boolean {
    return this.keycloakService.keycloak?.tokenParsed?.resource_access?.['PFE']?.roles?.includes('admin') ?? false;
  }

  goBack() {
    this.location.back();
  }

  onCancelChallenge() {
    const dialogRef = this.dialog.open(AnnulerChallengeDialog);
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.expiryReason = 'cancelled';
        this.expireChallenge();
      }
    });
  }
}

@Component({
  template: `
    <div class="annuler-modal">
      <h2>Annuler le défi ?</h2>
      <div>
        <p>Êtes-vous sûr de vouloir annuler ce défi ?<br>
        <strong>Votre candidature sera immédiatement mise à REFUSEE.</strong></p>
      </div>
      <div class="annuler-modal-actions">
        <button class="cancel-btn" (click)="dialogRef.close(false)">Non</button>
        <button class="confirm-btn" (click)="dialogRef.close(true)">Oui, annuler</button>
      </div>
    </div>
  `,
  styleUrls: ['./code-executor.component.css']
})
export class AnnulerChallengeDialog {
  constructor(public dialogRef: MatDialogRef<AnnulerChallengeDialog>) { }
}
