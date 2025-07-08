import { HttpClient } from '@angular/common/http';
import { Component, Input, Output, EventEmitter, ViewEncapsulation, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Candidature } from 'src/app/Data/Candidature';
import { ExportToCsv } from 'export-to-csv';

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

  constructor(private sanitizer: DomSanitizer, private http: HttpClient) { }

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
}
