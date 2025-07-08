import { HttpClient } from "@angular/common/http"
import { Component, Inject, type OnInit, type OnDestroy } from "@angular/core"
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { MatSnackBar } from "@angular/material/snack-bar";
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

  activeTab: "challenges" | "candidatures" | "ajouter" = "challenges"

  // Gestion des défis
  challenges: CodingChallenge[] = []
  candidatures: Candidature[] = []
  availableLanguages = this.challengeService.getAvailableLanguages()

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
  showFullWidthFilterBar = false;
  showCandidatureFilterBar = false;

  constructor(
    private challengeService: ChallengeService,
    private candidatureService: CandidatureService,
    private testCaseService: TestCaseService,
    private http: HttpClient,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit() {
    this.loadData()
  }

  ngOnDestroy() {
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'ACCEPTÉ':
        return 'chip-success';
      case 'REJETÉ':
        return 'chip-danger';
      case 'EN ATTENTE':
      default:
        return 'chip-warning';
    }
  }

  getChallengeStatutClass(statutDefi: string): string {
    switch (statutDefi) {
      case 'ENVOYE':
        return 'chip-primary';
      case 'TERMINE':
        return 'chip-info';
      case 'EVALUE':
        return 'chip-success';
      case 'AUCUN':
      default:
        return 'chip-neutral';
    }
  }

  getCardStatusClass(app: Candidature): string {
    if (app.statut === 'REJETÉ') return 'card-rejected';
    if (app.statut === 'ACCEPTÉ') return 'card-accepted';
    if (app.statut === 'EN ATTENTE') return 'card-pending';

    // Optional override for challenge status (use priority rules if needed)
    if (app.statutDefi === 'ENVOYE') return 'card-challenge-envoye';
    if (app.statutDefi === 'TERMINE') return 'card-challenge-termine';

    return '';
  }



  loadData() {
    // Load challenges using the service
    this.challengeService.getAllChallenges().subscribe({
      next: (challenges) => {
        this.challenges = challenges
      },
      error: (error) => {
        console.error("Error loading challenges:", error)
      }
    })

    // Load candidatures using the service
    this.candidatureService.getAllCandidatures().subscribe({
      next: (candidatures) => {
        this.candidatures = candidatures
      },
      error: (error) => {
        console.error("Error loading candidatures:", error)
      }
    })
  }

  onDelete(id: number, cancelCallback: () => any = () => { }) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '250px',
      data: { message: 'Voulez-vous vraiment supprimer ce challenge ?', title: 'Confirmation de suppression' },
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.challengeService.deleteChallenge(id).subscribe({
          next: () => {

            this.openSnackBar('Challenge supprimée avec succès', 'X', 'success-snackbar', 5000);
            console.log(`Challenge avec l'id ${id} supprimée avec succès.`);
            this.loadData();

          },
          error: (err) => {
            console.error('Erreur lors de la suppression de Challenge :', err);
            this.openSnackBar('Échec de la suppression de Challenge', 'X', 'error-snackbar', 3000);
          }

        }
        );
      } else {
        cancelCallback();
        this.openSnackBar('Suppression annulée', 'X', 'error-snackbar', 5000);
      }
    });
  }

  // Gestion des onglets
  setActiveTab(tab: "challenges" | "candidatures" | "ajouter") {
    this.activeTab = tab
  }

  // Création de défi
  onLanguageChange() {
    const selectedLang = this.availableLanguages.find((lang) => lang.id === this.newChallenge.languageId)
    if (selectedLang) {
      this.newChallenge.languageName = selectedLang.name
      this.updateStarterCode()
    }
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
      };

      this.newChallenge.testCases = [...(this.newChallenge.testCases || []), testCase];

      this.newTestCase = {
        entree: "",
        sortieAttendue: "",
        estCache: false,
        points: 10,
      };
    }
  }

  removeTestCase(index: number) {
    if (this.newChallenge.testCases) {
      this.newChallenge.testCases.splice(index, 1)
    }
  }

  createChallenge(): void {
    // Basic validation before sending
    if (!this.validateChallenge()) {
      alert("Please fill in all required fields and add at least one test case.");
      return;
    }

    this.isCreatingChallenge = true;

    // Prepare challenge data with test cases but without IDs (let backend generate)
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
        // no 'id' here to avoid conflicts
      })),
      codeDepart: this.newChallenge.codeDepart || "",
      statut: this.newChallenge.statut!,
    };

    this.challengeService.createChallenge(challengeToCreate).subscribe({
      next: (createdChallenge) => {
        console.log("Challenge created successfully:", createdChallenge);
        this.challenges.push(createdChallenge);

        // Reset form and UI state
        this.resetChallengeForm();
        this.setActiveTab("challenges");
        this.isCreatingChallenge = false;

        alert("Challenge created successfully!");
      },
      error: (err) => {
        console.error("Error creating challenge:", err);
        alert("Failed to create challenge. Please try again.");
        this.isCreatingChallenge = false;
      }
    });
  }


  // Edit challenge functionality
  editChallenge(challenge: CodingChallenge) {
    this.selectedChallenge = challenge;
    // You can implement edit modal or navigate to edit page
    console.log("Edit challenge:", challenge);
  }


  validateChallenge(): boolean {
    return !!(
      this.newChallenge.titre &&
      this.newChallenge.description &&
      this.newChallenge.languageId &&
      this.newChallenge.testCases &&
      this.newChallenge.testCases.length > 0
    )
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

  // Gestion des candidatures
  openSendChallengeModal(candidature: Candidature) {
    this.selectedApplication = candidature
    this.showSendChallengeModal = true
  }

  sendChallengeToApplicant(challengeId: number) {
    if (this.selectedApplication) {
      this.challengeService.envoyerDefiAuCandidat(this.selectedApplication.id, challengeId).subscribe({
        next: (responseMessage) => {
          // The backend returns a success message string, so just proceed
          console.log("Défi envoyé avec succès!", responseMessage);
          alert("Challenge sent successfully!");
          this.showSendChallengeModal = false;
          this.selectedApplication = null;

          // Refresh candidatures to show updated status
          this.loadData();
        },
        error: (error) => {
          console.error("Erreur lors de l'envoi du défi:", error);
          alert("Failed to send challenge. Please try again.");
        },
      });
    }
  }


  closeSendChallengeModal() {
    this.showSendChallengeModal = false
    this.selectedApplication = null
  }

  // Méthodes utilitaires pour les couleurs (updated for custom CSS classes)
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      "EN ATTENTE": "status-pending",
      ACCEPTÉ: "status-accepted",
      REJETÉ: "status-rejected",
      AUCUN: "status-none",
      ENVOYE: "status-sent",
      TERMINE: "status-completed",
      EVALUE: "status-evaluated",
      // Statuts des défis
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


  openSnackBar(
    message: string,
    action: string = 'X',
    className: string = '',
    duration: number = 5000
  ) {
    console.log('Opening SnackBar with class:', className);
    this.snackBar.open(message, action, {
      duration: duration,
      horizontalPosition: 'start',
      verticalPosition: 'bottom',
      panelClass: className ? [className] : undefined
    });
  }


  // Add these properties to your component
  challengeFilters = {
    difficulty: 'all',
    status: 'all',
    language: 'all'
  };

  candidatureFilters = {
    applicationStatus: 'all',
    challengeStatus: 'all',
    scoreRange: 'all'
  };

  // Challenge Filter Methods
  getFilteredChallenges(): CodingChallenge[] {
    return this.challenges.filter(challenge => {
      // Difficulty filter
      if (this.challengeFilters.difficulty !== 'all' &&
        challenge.difficulte !== this.challengeFilters.difficulty) {
        return false;
      }

      // Status filter
      if (this.challengeFilters.status !== 'all' &&
        challenge.statut !== this.challengeFilters.status) {
        return false;
      }

      // Language filter
      if (this.challengeFilters.language !== 'all' &&
        challenge.languageName !== this.challengeFilters.language) {
        return false;
      }

      return true;
    });
  }

  onChallengeFilterChange() {
    // Trigger change detection and any additional logic
    console.log('Challenge filters changed:', this.challengeFilters);
  }

  clearChallengeFilters() {
    this.challengeFilters = {
      difficulty: 'all',
      status: 'all',
      language: 'all'
    };
  }

  getUniqueLanguages(): string[] {
    const languages = this.challenges.map(c => c.languageName);
    return [...new Set(languages)].sort();
  }

  // Candidature Filter Methods
  getFilteredCandidatures(): Candidature[] {
    return this.candidatures.filter(candidature => {
      // Application status filter
      if (this.candidatureFilters.applicationStatus !== 'all' &&
        candidature.statut !== this.candidatureFilters.applicationStatus) {
        return false;
      }

      // Challenge status filter
      if (this.candidatureFilters.challengeStatus !== 'all') {
        const challengeStatus = candidature.statutDefi || 'AUCUN';
        if (challengeStatus !== this.candidatureFilters.challengeStatus) {
          return false;
        }
      }

      // Score range filter
      if (this.candidatureFilters.scoreRange !== 'all') {
        const score = candidature.scoreCV;
        switch (this.candidatureFilters.scoreRange) {
          case '0-30':
            if (score > 30) return false;
            break;
          case '31-60':
            if (score < 31 || score > 60) return false;
            break;
          case '61-80':
            if (score < 61 || score > 80) return false;
            break;
          case '81-100':
            if (score < 81) return false;
            break;
        }
      }

      return true;
    });
  }

  onCandidatureFilterChange() {
    // Trigger change detection and any additional logic
    console.log('Candidature filters changed:', this.candidatureFilters);
  }

  clearCandidatureFilters() {
    this.candidatureFilters = {
      applicationStatus: 'all',
      challengeStatus: 'all',
      scoreRange: 'all'
    };
  }

  // Enhanced Badge Methods
  getDifficultyBadgeClass(difficulty: string): string {
    const classes: { [key: string]: string } = {
      'Facile': 'badge-green',
      'Moyen': 'badge-yellow',
      'Difficile': 'badge-red'
    };
    return classes[difficulty] || 'badge-gray';
  }

  getDifficultyIcon(difficulty: string): string {
    const icons: { [key: string]: string } = {
      'Facile': '🟢',
      'Moyen': '🟡',
      'Difficile': '🔴'
    };
    return icons[difficulty] || '⚪';
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'Brouillon': 'badge-draft',
      'Actif': 'badge-active',
      'Archive': 'badge-archived'
    };
    return classes[status] || 'badge-gray';
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'Brouillon': '📝',
      'Actif': '✅',
      'Archive': '📦'
    };
    return icons[status] || '⚪';
  }

  getScoreBadgeClass(score: number): string {
    if (score >= 81) return 'badge-score-excellent';
    if (score >= 61) return 'badge-score-good';
    if (score >= 31) return 'badge-score-medium';
    return 'badge-score-low';
  }

  setChallengeFilter(type: 'difficulty' | 'status' | 'language', value: string) {
    this.challengeFilters[type] = value;
    this.onChallengeFilterChange();
  }

  get challengeLanguageChips(): string[] {
    return ['all', ...this.getUniqueLanguages()];
  }

  setCandidatureFilter(type: 'applicationStatus' | 'challengeStatus' | 'scoreRange', value: string) {
    this.candidatureFilters[type] = value;
    this.onCandidatureFilterChange();
  }

}


export interface DialogData {
  message: string;
  title: string;
}

@Component({
  template: `
    
    <div class="dialog-container">
      <h1 class="dialog-title">{{ data.title }}</h1>
      <div class="dialog-actions">
        <button class="cancel-button" (click)="onNoClick()">Cancel</button>
        <button class="ok-button" (click)="onYesClick()">Ok</button>
      </div>
    </div>

    
    `, styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmationDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}