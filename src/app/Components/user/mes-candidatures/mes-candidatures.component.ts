import { Component, Inject, OnInit } from '@angular/core';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { Candidature } from 'src/app/Data/Candidature';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-mes-candidatures',
  templateUrl: './mes-candidatures.component.html',
  styleUrls: ['./mes-candidatures.component.css']
})
export class MesCandidaturesComponent implements OnInit {
  candidatures: Candidature[] = [];
  userId: string | undefined;
  loading = true;
  selectedCandidature: Candidature | null = null;
  totalPages: number = 0;
  totalItems: number = 0;
  currentPage: number = 0;
  pageSize: number = 10;

  constructor(
    private candidatureService: CandidatureService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      this.userId = decoded.sub;
    }
    this.loadCandidatures();
  }

  loadCandidatures() {
    this.candidatureService.getAllCandidaturesList().subscribe((cands) => {
      if (this.userId) {
        this.candidatures = cands.filter(c => c.creePar === this.userId);
      } else {
        this.candidatures = [];
      }
      this.loading = false;
    });
  }

  selectCandidature(c: Candidature): void {
    this.selectedCandidature = c;
  }

  clearSelected(): void {
    this.selectedCandidature = null;
  }

  confirmAndDeleteCandidature(id: number, cancelCallback: () => any = () => {}): void {
    const dialogRef = this.dialog.open(ConfirmCandidatureDialog, {
      width: '250px',
      data: { message: 'hello', title: 'Are you sure?' },
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.candidatureService.deleteCandidature(id).subscribe({
          next: () => {
            console.log(`candidature with id ${id} deleted successfully.`);
            this.loadCandidatures();
          },
          error: (err) => {
            console.error('Error deleting candidature:', err);
          }
        });
      } else {
        cancelCallback();
      }
    });
  }

  get enAttenteCount(): number {
    return this.candidatures.filter((c) => c.statut === 'EN ATTENTE').length;
  }

  get defiEnvoyeOuTermineCount(): number {
    return this.candidatures.filter(
      (c) => c.statutDefi === 'ENVOYE' || c.statutDefi === 'TERMINE'
    ).length;
  }

  get acceptedPercentage(): number {
    return this.candidatures.length > 0
      ? (this.candidatures.filter((c) => c.statut === 'ACCEPTÉ').length /
          this.candidatures.length) *
          100
      : 0;
  }

  get hasCandidatures(): boolean {
    return this.candidatures.length > 0;
  }

  get candidaturesEnAttente(): Candidature[] {
    return this.candidatures.filter((c) => c.statut === 'EN ATTENTE');
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
  `,
  styleUrls: ['./mes-candidatures.component.css']
})
export class ConfirmCandidatureDialog {
  constructor(
    public dialogRef: MatDialogRef<ConfirmCandidatureDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close(false);
  }

  onYesClick(): void {
    this.dialogRef.close(true);
  }
}
