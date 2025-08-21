import { HttpClient } from '@angular/common/http';
import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Candidature } from 'src/app/Data/Candidature';
import { ExportToCsv } from 'export-to-csv';
import { CodingChallenge } from 'src/app/Data/coding-challenge.model';
import { ChallengeService } from 'src/app/Services/fn/challenge/challenge-service.service';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { ResultatEntretien } from 'src/app/Data/Entretien';
import { EntretienService } from 'src/app/Services/fn/entretien/entretien.service';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';

@Component({
  selector: 'app-on-view-dialog',
  templateUrl: './on-view-dialog.component.html',
  styleUrls: ['./on-view-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class OnViewDialogComponent implements OnInit, OnChanges {
  @Input() data!: Candidature;
  @Input() show = false;
  @Output() close = new EventEmitter<void>();
  @Output() entretienDeleted = new EventEmitter<void>();


  settings = false;
  cvUrl: SafeResourceUrl | null = null;
  defiTitre: string | null = null;
  statusOptions: Candidature['statut'][] = ['EN ATTENTE', 'ACCEPTÉ', 'REFUSEE'];



  constructor(private sanitizer: DomSanitizer,
    private http: HttpClient,
    private challengeService: ChallengeService,
    private candidatureService: CandidatureService,
    private entretienService: EntretienService,
    private keycloakService: KeycloakService) { }

  isAdmin(): boolean {
    return this.keycloakService.keycloak?.tokenParsed?.resource_access?.['PFE']?.roles?.includes('admin') ?? false;
  }

  ngOnInit() {
    // No logic here that depends on @Input() data
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      // this.selectedStatus = this.data.statut;
      if (this.data.cv) {
        this.loadCV(this.data.cv);
      } else {
        this.cvUrl = null;
      }

      if (this.data.defi && this.data.defi.id) {
        this.challengeService.getChallengeById(this.data.defi.id).subscribe({
          next: (ch) => {
            this.defiTitre = ch.titre;
            console.log(this.data.defi);
          },
          error: (err) => {
            console.error('Erreur défi:', err);
          }
        });
      }



    }
  }


  entretienEdit = false;
  entretienDateString: string | null = null;

  startEditEntretien() {
    this.entretienEdit = true;

    if (!this.data.entretien) {
      this.data.entretien = {
        id: undefined,
        dateEntretien: '',
        commentaireRH: null,
        resultat: ResultatEntretien.EN_ATTENTE,
        lien: ''
      };
    }

    if (this.data.entretien.dateEntretien) {
      const d = new Date(this.data.entretien.dateEntretien);
      this.entretienDateString = d.toISOString().slice(0, 16);
    } else {
      this.entretienDateString = null;
    }
  }


  cancelEditEntretien() {
    this.entretienEdit = false;
    this.entretienDateString = null;
  }
  saveEntretien() {
    if (!this.data.entretien) {
      this.data.entretien = {
        dateEntretien: '',
        commentaireRH: null,
        resultat: ResultatEntretien.EN_ATTENTE,
        lien: ''
      };
    }
    if (this.entretienDateString) {
      this.data.entretien.dateEntretien = new Date(this.entretienDateString).toISOString();
    } else {
      this.data.entretien.dateEntretien = '';
    }

    // Use entretienService to update the entretien directly
    this.entretienService.updateEntretien(this.data.entretien.id!, this.data.entretien).subscribe({
      next: (updatedEntretien) => {
        this.data.entretien = updatedEntretien;
        this.entretienEdit = false;
        this.entretienDateString = null;
      },
      error: (err) => {
        console.error('Error updating entretien:', err);
      }
    });
  }

  deleteEntretien() {
    if (!this.data.entretien?.id) return;

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet entretien ?')) return;

    this.entretienService.deleteEntretien(this.data.entretien.id).subscribe({
      next: () => {
        this.data.entretien = undefined;
        this.entretienEdit = false;
        this.entretienDateString = null;
        console.log('Entretien deleted successfully.');
        this.entretienDeleted.emit(); // Notify parent to refresh or handle
      },
      error: (err) => console.error('Error deleting entretien:', err)
    });
  }



  loadCV(filename: string): void {
    this.http
      .get(`http://localhost:8089/uploads/${encodeURIComponent(filename)}`, {
        responseType: 'blob',
        withCredentials: true, // If cookies or session are needed
      })
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        this.cvUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      });
  }

  onClose() {
    this.close.emit();
  }

  onOpen(candidature: Candidature) {
    if (candidature.cv) {
      const encodedFileName = encodeURIComponent(candidature.cv);
      const fullUrl = `http://localhost:8089/uploads/${encodedFileName}`;
      window.open(fullUrl, '_blank');
    } else {
      console.warn('No CV available');
      console.log(candidature.cv)
    }
  }

  enableSettings() {
    this.settings = true;
  }

  cancelEdit() {
    this.settings = false;
  }

  onStatusChange(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const newStatus = selectElement.value as Candidature['statut'];
    this.data.statut = newStatus;

    this.candidatureService.updateCandidature(this.data.id, this.data).subscribe({
      next: (updated) => {
        this.data = updated;
        this.settings = false;
      },
      error: (err) => {
        console.error('Error updating status:', err);
      }
    });
  }



  getStatusColor(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return '#ffc107'; // amber
      case 'ACCEPTÉ':
        return '#4caf50'; // green
      case 'REFUSEE':
        return '#f44336'; // red
      default:
        return '#9e9e9e'; // default gray color
    }
  }

  getChallengeStatutColor(statut: string): string {
    switch (statut) {
      case 'AUCUN':
        return '#9e9e9e'; // gray
      case 'ENVOYE':
        return '#2196f3'; // blue
      case 'TERMINE':
        return '#4caf50'; // green
      case 'EVALUE':
        return '#ff9800'; // orange
      default:
        return '#bdbdbd'; // light gray
    }
  }


  downloadCandidature(): void {
    const candidatureData = [{
      Nom: this.data.nom,
      Email: this.data.email,
      Téléphone: this.data.telephone,
      Lettre_de_motivation: this.data.coverLetter,
      Statut: this.data.statut,
      DefiId: this.data.defiId,
      Datedefi: this.data.defiEnvoyeLe,
      CV: `http://localhost:8089/uploads/${this.data.cv}`
    }];

    const options = {
      fieldSeparator: ',',
      filename: `${this.data.nom}_candidature`,
      quoteStrings: '"',
      decimalSeparator: '.',
      showLabels: true,
      useBom: true,
      headers: ['Nom', 'Email', 'Téléphone', 'Lettre_de_motivation', 'Statut', 'CV'],
    };

    const csvExporter = new ExportToCsv(options);
    csvExporter.generateCsv(candidatureData);
  }

  get defiStatut(): string | null {
    return this.data && this.data.statutDefi ? this.data.statutDefi : null;
  }
}
