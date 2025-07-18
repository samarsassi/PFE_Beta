import { HttpClient } from '@angular/common/http';
import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Candidature } from 'src/app/Data/Candidature';
import { ExportToCsv } from 'export-to-csv';
import { CodingChallenge } from 'src/app/Data/coding-challenge.model';
import { ChallengeService } from 'src/app/Services/fn/challenge/challenge-service.service';

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

  settings = false;
  selectedStatus: Candidature["statut"] = 'EN ATTENTE';
  cvUrl: SafeResourceUrl | null = null;
  defiTitre: string | null = null;

  constructor(private sanitizer: DomSanitizer, private http: HttpClient, private challengeService: ChallengeService) { }

  ngOnInit() {
    // No logic here that depends on @Input() data
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data'] && this.data) {
      this.selectedStatus = this.data.statut;
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

  getStatusColor(status: string): string {
    switch (status) {
      case 'EN_ATTENTE':
        return '#ffc107'; // amber
      case 'ACCEPTÉ':
        return '#4caf50'; // green
      case 'REJETÉ':
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

  updateStatus(): void {
    this.data.statut = this.selectedStatus;
  }

  enableSettings() {
    this.settings = true;
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
