import { HttpClient } from "@angular/common/http"
import { Component, Inject, type OnInit, OnDestroy } from "@angular/core"
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog"
import { MatSnackBar, MatSnackBarRef } from "@angular/material/snack-bar"
import { Candidature } from "src/app/Data/Candidature"
import { CodingChallenge, TestCase } from "src/app/Data/coding-challenge.model"
import { CandidatureService } from "src/app/Services/fn/candidature/candidature.service"
import { ChallengeService } from "src/app/Services/fn/challenge/challenge-service.service"
import { TestCaseService } from "src/app/Services/fn/testCase/test-case.service"

@Component({
  selector: "app-admin-dashboard",
  templateUrl: "./admin-dashboard.component.html",
  styleUrls: ["./admin-dashboard.component.css"],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  activeTab: "challenges" | "ajouter" = "challenges"

  // Gestion des défis
  challenges: CodingChallenge[] = []
  candidatures: Candidature[] = []

  // Fix: Initialize availableLanguages properly
  availableLanguages: { id: number; name: string }[] = []

  // Formulaire de création de défi
  newChallenge: Partial<CodingChallenge> = {
    titre: "",
    description: "",
    languageId: 71,
    languageName: "Python (3.8.1)",
    difficulte: "Facile",
    tempslimite: 60,
    memoirelimite: 128000,
    testCases: [],
    codeDepart: "",
    statut: "Brouillon",
  }

  newTestCase: Partial<TestCase> = {
    entree: "",
    sortieAttendue: "",
    estCache: false,
    points: 10,
  }

  // État de l'interface
  isCreatingChallenge = false
  selectedChallenge: CodingChallenge | null = null
  selectedApplication: Candidature | null = null
  showSendChallengeModal = false
  showFilterModal = false
  showFullWidthFilterBar = false
  showCandidatureFilterBar = false

  // --- Split View Edit State ---
  editingChallenge: CodingChallenge | null = null;
  editChallengeForm: Partial<CodingChallenge> = {};
  editNewTestCase: Partial<TestCase> = { entree: '', sortieAttendue: '', estCache: false, points: 10 };

  startEditChallenge(challenge: CodingChallenge) {
    this.editingChallenge = challenge;
    // Deep copy to avoid mutating the original before save
    this.editChallengeForm = JSON.parse(JSON.stringify(challenge));
    this.editNewTestCase = { entree: '', sortieAttendue: '', estCache: false, points: 10 };
  }

  cancelEditChallenge() {
    this.editingChallenge = null;
    this.editChallengeForm = {};
    this.editNewTestCase = { entree: '', sortieAttendue: '', estCache: false, points: 10 };
  }

  submitEditChallenge() {
    if (!this.editingChallenge || !this.editChallengeForm) return;
    // Validate (reuse validateChallenge logic if possible)
    if (!this.editChallengeForm.titre || !this.editChallengeForm.description || !this.editChallengeForm.languageId || !this.editChallengeForm.languageName || !this.editChallengeForm.testCases || this.editChallengeForm.testCases.length === 0) {
      alert('Please fill in all required fields and add at least one test case.');
      return;
    }
    // Show confirmation dialog
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '320px',
      data: { message: 'Are you sure you want to save changes to this challenge?', title: 'Confirm Edit' },
      autoFocus: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Update language name
        const selectedLang = this.availableLanguages.find(lang => lang.id === this.editChallengeForm.languageId);
        if (selectedLang) {
          this.editChallengeForm.languageName = selectedLang.name;
        }
        // Prepare update object
        const updatedChallenge: CodingChallenge = {
          ...this.editingChallenge,
          ...this.editChallengeForm,
          titre: this.editChallengeForm.titre!,
          description: this.editChallengeForm.description!,
          languageId: this.editChallengeForm.languageId!,
          languageName: this.editChallengeForm.languageName!,
          difficulte: this.editChallengeForm.difficulte!,
          tempslimite: this.editChallengeForm.tempslimite!,
          memoirelimite: this.editChallengeForm.memoirelimite!,
          codeDepart: this.editChallengeForm.codeDepart || "",
          statut: this.editChallengeForm.statut || "Brouillon",
          testCases: (this.editChallengeForm.testCases || []).map(tc => ({
            entree: tc.entree,
            sortieAttendue: tc.sortieAttendue,
            estCache: tc.estCache || false,
            points: tc.points || 10,
          })),
        };
        if (updatedChallenge.id == null) {
          alert('Challenge ID is missing. Cannot update.');
          return;
        }
        this.challengeService.updateChallenge(updatedChallenge.id, updatedChallenge).subscribe({
          next: () => {
            this.snackBar.openFromComponent(AdminSnackBarComponent, {
              duration: 5000,
              horizontalPosition: 'start',
              verticalPosition: 'bottom',
            });
            this.cancelEditChallenge();
            this.activeTab = 'challenges';
            this.loadData();
          },
          error: (error) => {
            console.error(error);
            alert('An error occurred while updating the challenge.');
          }
        });
      }
    });
  }

  addEditTestCase() {
    if (this.editNewTestCase.entree && this.editNewTestCase.sortieAttendue) {
      if (!this.editChallengeForm.testCases) this.editChallengeForm.testCases = [];
      this.editChallengeForm.testCases = [
        ...this.editChallengeForm.testCases,
        {
          entree: this.editNewTestCase.entree,
          sortieAttendue: this.editNewTestCase.sortieAttendue,
          estCache: this.editNewTestCase.estCache || false,
          points: this.editNewTestCase.points || 10,
        }
      ];
      this.editNewTestCase = { entree: '', sortieAttendue: '', estCache: false, points: 10 };
    }
  }

  removeEditTestCase(index: number) {
    if (this.editChallengeForm.testCases) {
      this.editChallengeForm.testCases.splice(index, 1);
    }
  }

  onEditLanguageChange() {
    if (this.editChallengeForm.languageId && this.availableLanguages.length > 0) {
      const selectedLang = this.availableLanguages.find((lang) => lang.id === this.editChallengeForm.languageId);
      if (selectedLang) {
        this.editChallengeForm.languageName = selectedLang.name;
      }
    }
  }

  constructor(
    private challengeService: ChallengeService,
    private candidatureService: CandidatureService,
    private testCaseService: TestCaseService,
    private http: HttpClient,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
  ) { }

  ngOnInit() {
    // Fix: Initialize available languages first
    this.initializeAvailableLanguages()
    this.loadData()
  }

  ngOnDestroy() { }

  // Fix: Properly initialize available languages
  private initializeAvailableLanguages() {
    // Try to get from service first
    const serviceLanguages = this.challengeService.getAvailableLanguages()

    if (serviceLanguages && Array.isArray(serviceLanguages) && serviceLanguages.length > 0) {
      this.availableLanguages = serviceLanguages
    } else {
      // Fallback to hardcoded languages
      this.availableLanguages = [
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
    }

    // Ensure the initial language name is set correctly
    this.syncLanguageName()
  }

  // Fix: Improved language change handler
  onLanguageChange() {
    console.log("Language changed to ID:", this.newChallenge.languageId)
    this.syncLanguageName()
    this.updateStarterCode()
  }

  // Fix: Separate method to sync language name
  private syncLanguageName() {
    if (this.newChallenge.languageId && this.availableLanguages.length > 0) {
      const selectedLang = this.availableLanguages.find((lang) => lang.id === this.newChallenge.languageId)
      if (selectedLang) {
        this.newChallenge.languageName = selectedLang.name
        console.log("Language name updated to:", this.newChallenge.languageName)
      } else {
        console.warn("Language not found for ID:", this.newChallenge.languageId)
      }
    }
  }

  // Rest of your existing methods...
  getStatutClass(statut: string): string {
    switch (statut) {
      case "ACCEPTÉ":
        return "chip-success"
      case "REFUSEE":
        return "chip-danger"
      case "EN ATTENTE":
      default:
        return "chip-warning"
    }
  }

  getChallengeStatutClass(statutDefi: string): string {
    switch (statutDefi) {
      case "ENVOYE":
        return "chip-primary"
      case "TERMINE":
        return "chip-info"
      case "EVALUE":
        return "chip-success"
      case "AUCUN":
      default:
        return "chip-neutral"
    }
  }

  getCardStatusClass(app: Candidature): string {
    if (app.statut === "REFUSEE") return "card-rejected"
    if (app.statut === "ACCEPTÉ") return "card-accepted"
    if (app.statut === "EN ATTENTE") return "card-pending"
    if (app.statutDefi === "ENVOYE") return "card-challenge-envoye"
    if (app.statutDefi === "TERMINE") return "card-challenge-termine"
    return ""
  }

  loadData() {
    this.challengeService.getAllChallenges().subscribe({
      next: (challenges) => {
        this.challenges = challenges
      },
      error: (error) => {
        console.error("Error loading challenges:", error)
      },
    })

    this.candidatureService.getAllCandidatures().subscribe({
      next: (candidatures) => {
        this.candidatures = candidatures
      },
      error: (error) => {
        console.error("Error loading candidatures:", error)
      },
    })
  }

  onDelete(id: number, cancelCallback: () => any = () => { }) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: "250px",
      data: { message: "Voulez-vous vraiment supprimer ce challenge ?", title: "Confirmation de suppression" },
      autoFocus: true,
    })

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.challengeService.deleteChallenge(id).subscribe({
          next: () => {
            this.openSnackBar("Challenge supprimée avec succès", "X", "success-snackbar", 5000)
            console.log(`Challenge avec l'id ${id} supprimée avec succès.`)
            this.loadData()
          },
          error: (err) => {
            console.error("Erreur lors de la suppression de Challenge :", err)
            this.openSnackBar("Échec de la suppression de Challenge", "X", "error-snackbar", 3000)
          },
        })
      } else {
        cancelCallback()
        this.openSnackBar("Suppression annulée", "X", "error-snackbar", 5000)
      }
    })
  }

  setActiveTab(tab: "challenges" | "ajouter") {
    this.activeTab = tab
  }

  updateStarterCode() {
    const starterCodes: { [key: number]: string } = {
      50: `#include <stdio.h>\n\nint main() {\n    // Votre code ici\n    return 0;\n}`,
      54: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Votre code ici\n    return 0;\n}`,
      62: `public class Solution {\n    public static void main(String[] args) {\n        // Votre code ici\n    }\n}`,
      71: `def solution():\n    # Votre code ici\n    pass\n\nif __name__ == "__main__":\n    solution()`,
      63: `function solution() {\n    // Votre code ici\n}\n\nsolution();`,
      68: `<?php\nfunction solution() {\n    // Votre code ici\n}\n\nsolution();\n?>`,
      51: `using System;\n\nclass Program {\n    static void Main() {\n        // Votre code ici\n    }\n}`,
      78: `fun main() {\n    // Votre code ici\n}`,
      72: `def solution\n    # Votre code ici\nend\n\nsolution`,
      73: `fn main() {\n    // Votre code ici\n}`,
    }
    this.newChallenge.codeDepart = starterCodes[this.newChallenge.languageId!] || ""
  }

  addTestCase() {
    if (this.newTestCase.entree && this.newTestCase.sortieAttendue) {
      const testCase: TestCase = {
        entree: this.newTestCase.entree,
        sortieAttendue: this.newTestCase.sortieAttendue,
        estCache: this.newTestCase.estCache || false,
        points: this.newTestCase.points || 10,
      }
      this.newChallenge.testCases = [...(this.newChallenge.testCases || []), testCase]
      this.newTestCase = {
        entree: "",
        sortieAttendue: "",
        estCache: false,
        points: 10,
      }
    }
  }

  removeTestCase(index: number) {
    if (this.newChallenge.testCases) {
      this.newChallenge.testCases.splice(index, 1)
    }
  }

  getLanguageNameById(id: number): string {
    const lang = this.availableLanguages.find((l) => l.id === id)
    return lang ? lang.name : ""
  }

  // Fix: Improved createChallenge method
  createChallenge(): void {
    if (!this.validateChallenge()) {
      alert("Please fill in all required fields and add at least one test case.");
      return;
    }

    this.isCreatingChallenge = true;

    const selectedLang = this.availableLanguages.find(lang => lang.id === this.newChallenge.languageId);
    if (!selectedLang) {
      alert("Selected language is invalid.");
      this.isCreatingChallenge = false;
      return;
    }
    this.newChallenge.languageName = selectedLang.name;

    const challengeToCreate: Omit<CodingChallenge, 'id'> = {
      titre: this.newChallenge.titre!,
      description: this.newChallenge.description!,
      languageId: this.newChallenge.languageId!,
      languageName: this.newChallenge.languageName!,
      difficulte: this.newChallenge.difficulte!,
      tempslimite: this.newChallenge.tempslimite!,
      memoirelimite: this.newChallenge.memoirelimite!,
      testCases: (this.newChallenge.testCases || []).map(tc => ({
        entree: tc.entree,
        sortieAttendue: tc.sortieAttendue,
        estCache: tc.estCache || false,
        points: tc.points || 10,
      })),
      codeDepart: this.newChallenge.codeDepart || "",
      statut: this.newChallenge.statut!,
    };

    console.log('Submitting challenge:', challengeToCreate); // DEBUG

    this.challengeService.createChallenge(challengeToCreate).subscribe({
      next: () => {
        alert('Challenge created successfully');
        this.resetChallengeForm();
        this.activeTab = 'challenges';
        this.loadData();
      },
      error: (error) => {
        console.error(error);
        alert('An error occurred while creating the challenge.');
      },
      complete: () => {
        this.isCreatingChallenge = false;
      }
    });
  }


  editChallenge(challenge: CodingChallenge) {
    this.selectedChallenge = challenge
    console.log("Edit challenge:", challenge)
  }

  validateChallenge(): boolean {
    const isValid = !!(
      this.newChallenge.titre &&
      this.newChallenge.description &&
      this.newChallenge.languageId &&
      this.newChallenge.languageName && // Also validate language name
      this.newChallenge.testCases &&
      this.newChallenge.testCases.length > 0
    )

    if (!isValid) {
      console.log("Validation failed:", {
        titre: this.newChallenge.titre,
        description: this.newChallenge.description,
        languageId: this.newChallenge.languageId,
        languageName: this.newChallenge.languageName,
        testCasesLength: this.newChallenge.testCases?.length,
      })
    }

    return isValid
  }

  resetChallengeForm() {
    this.newChallenge = {
      titre: "",
      description: "",
      languageId: 71,
      languageName: "Python (3.8.1)",
      difficulte: "Facile",
      tempslimite: 60,
      memoirelimite: 128000,
      testCases: [],
      codeDepart: "",
      statut: "Brouillon",
    }
    this.updateStarterCode()
  }

  // Rest of your existing methods remain the same...
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      "EN ATTENTE": "status-pending",
      ACCEPTÉ: "status-accepted",
      REFUSEE: "status-rejected",
      AUCUN: "status-none",
      ENVOYE: "status-sent",
      TERMINE: "status-completed",
      EVALUE: "status-evaluated",
      Brouillon: "status-draft",
      Actif: "status-active",
      Archive: "status-archived",
    }
    return colors[status] || "status-default"
  }

  getDifficultyColor(difficulty: string): string {
    const colors: { [key: string]: string } = {
      Facile: "difficulty-easy",
      Moyen: "difficulty-medium",
      Difficile: "difficulty-hard",
    }
    return colors[difficulty] || "difficulty-default"
  }

  openSnackBar(message: string, action = "X", className?: string, duration = 5000) {
    this.snackBar.open(message, action, {
      duration,
    });
  }

  // Filter properties and methods remain the same...
  challengeFilters = {
    difficulty: "all",
    status: "all",
    language: "all",
  }

  candidatureFilters = {
    applicationStatus: "all",
    challengeStatus: "all",
    scoreRange: "all",
  }

  getFilteredChallenges(): CodingChallenge[] {
    return this.challenges.filter((challenge) => {
      if (this.challengeFilters.difficulty !== "all" && challenge.difficulte !== this.challengeFilters.difficulty) {
        return false
      }
      if (this.challengeFilters.status !== "all" && challenge.statut !== this.challengeFilters.status) {
        return false
      }
      if (this.challengeFilters.language !== "all" && challenge.languageName !== this.challengeFilters.language) {
        return false
      }
      return true
    })
  }

  onChallengeFilterChange() {
    console.log("Challenge filters changed:", this.challengeFilters)
  }

  clearChallengeFilters() {
    this.challengeFilters = {
      difficulty: "all",
      status: "all",
      language: "all",
    }
  }

  getUniqueLanguages(): string[] {
    const languages = this.challenges.map((c) => c.languageName)
    return [...new Set(languages)].sort()
  }

  getFilteredCandidatures(): Candidature[] {
    return this.candidatures.filter((candidature) => {
      if (
        this.candidatureFilters.applicationStatus !== "all" &&
        candidature.statut !== this.candidatureFilters.applicationStatus
      ) {
        return false
      }
      if (this.candidatureFilters.challengeStatus !== "all") {
        const challengeStatus = candidature.statutDefi || "AUCUN"
        if (challengeStatus !== this.candidatureFilters.challengeStatus) {
          return false
        }
      }
      if (this.candidatureFilters.scoreRange !== "all") {
        const score = candidature.scoreCV
        switch (this.candidatureFilters.scoreRange) {
          case "0-30":
            if (score > 30) return false
            break
          case "31-60":
            if (score < 31 || score > 60) return false
            break
          case "61-80":
            if (score < 61 || score > 80) return false
            break
          case "81-100":
            if (score < 81) return false
            break
        }
      }
      return true
    })
  }

  onCandidatureFilterChange() {
    console.log("Candidature filters changed:", this.candidatureFilters)
  }

  clearCandidatureFilters() {
    this.candidatureFilters = {
      applicationStatus: "all",
      challengeStatus: "all",
      scoreRange: "all",
    }
  }

  getDifficultyBadgeClass(difficulty: string): string {
    const classes: { [key: string]: string } = {
      Facile: "badge-green",
      Moyen: "badge-yellow",
      Difficile: "badge-red",
    }
    return classes[difficulty] || "badge-gray"
  }

  getDifficultyIcon(difficulty: string): string {
    const icons: { [key: string]: string } = {
      Facile: "🟢",
      Moyen: "🟡",
      Difficile: "🔴",
    }
    return icons[difficulty] || "⚪"
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      Brouillon: "badge-draft",
      Actif: "badge-active",
      Archive: "badge-archived",
    }
    return classes[status] || "badge-gray"
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      Brouillon: "📝",
      Actif: "✅",
      Archive: "📦",
    }
    return icons[status] || "⚪"
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 81) return "badge-score-excellent"
    if (score >= 61) return "badge-score-good"
    if (score >= 31) return "badge-score-medium"
    return "badge-score-low"
  }

  setChallengeFilter(type: "difficulty" | "status" | "language", value: string) {
    this.challengeFilters[type] = value
    this.onChallengeFilterChange()
  }

  get challengeLanguageChips(): string[] {
    return ["all", ...this.getUniqueLanguages()]
  }

  setCandidatureFilter(type: "applicationStatus" | "challengeStatus" | "scoreRange", value: string) {
    this.candidatureFilters[type] = value
    this.onCandidatureFilterChange()
  }
}

export interface DialogData {
  message: string
  title: string
}

@Component({
  selector: "app-confirmation-dialog",
  template: `
    <div class="dialog-container">
      <h1 class="dialog-title">{{ data.title }}</h1>
      <div class="dialog-actions">
        <button class="cancel-button" (click)="onNoClick()">Cancel</button>
        <button class="ok-button" (click)="onYesClick()">Ok</button>
      </div>
    </div>
  `,
  styleUrls: ["./confirmation-dialog.component.css"],
})
export class ConfirmationDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  onNoClick(): void {
    this.dialogRef.close(false)
  }

  onYesClick(): void {
    this.dialogRef.close(true)
  }
}

@Component({
  selector: 'admin-snack-bar',
  template: `
    <div class="admin-snack-bar">
      <span>{{ message }}</span>
      <button class="close-btn" (click)="snackBarRef.dismiss()" title="Fermer">&times;</button>
    </div>
  `,
  styles: [`
    .admin-snack-bar {
      background: #2ecc40;
      color: #fff;
      border-radius: 4px;
      font-weight: 500;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-width: 220px;
      max-width: 340px;
      padding: 10px 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 1.3rem;
      margin-left: 12px;
      cursor: pointer;
      line-height: 1;
    }
  `]
})
export class AdminSnackBarComponent {
  message = 'Challenge modifié avec succès';
  constructor(public snackBarRef: MatSnackBarRef<AdminSnackBarComponent>) { }
}
