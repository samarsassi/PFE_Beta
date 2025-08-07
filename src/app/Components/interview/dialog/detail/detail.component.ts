import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ResultatEntretien } from 'src/app/Data/Entretien';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { EntretienService } from 'src/app/Services/fn/entretien/entretien.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent {
  
constructor(
    private http: HttpClient,
    private entretienService: EntretienService,
    private candidatureService: CandidatureService
  ) {}


   @Input() visible = false;
  @Input() data: any;

  @Output() close = new EventEmitter<void>();


  ngOnChanges() {
  console.log("DetailComponent received data:", this.data);
}

  onClose() {
    this.close.emit();
  }

  feedbackForm = {
  commentaireRH: '',
  resultat: ''
};

canAddFeedback(): boolean {
  if (!this.data?.dateEntretien) return false;
  const entretienDate = new Date(this.data.dateEntretien);
  const now = new Date();
  return entretienDate < now;
}

submitFeedback() {
  if (!this.data) return;

  if (!this.feedbackForm.commentaireRH.trim() || !this.feedbackForm.resultat) {
    alert("Merci de remplir tous les champs du feedback.");
    return;
  }

  const updatedEntretien = {
    id: this.data.id,
    dateEntretien: this.data.dateEntretien,
    commentaireRH: this.feedbackForm.commentaireRH.trim(),
     resultat: this.feedbackForm.resultat as ResultatEntretien,
    lien: this.data.lien,
    candidatureId: this.data.candidatureId,
  };

  if (!updatedEntretien.id) {
    console.error('Entretien ID missing');
    return;
  }

  console.log("📤 Payload being sent to backend:", JSON.stringify(updatedEntretien, null, 2));

  this.entretienService.updateEntretien(updatedEntretien.id, updatedEntretien).subscribe({
    next: (updated) => {
      alert("Feedback envoyé avec succès !");
      this.data = updated;
      this.feedbackForm = { commentaireRH: '', resultat: '' };

      if (updatedEntretien.resultat === 'REFUSEE') {
        
        console.log('Updating candidature status to REFUSEE for id:', updated.candidatureId);
        this.candidatureService.getCandidatureById(updatedEntretien.candidatureId).subscribe({
          next: (candidature) => {
             console.log('Candidature before update:', candidature);
            candidature.statut = 'REFUSEE';
            this.candidatureService.updateCandidature(updatedEntretien.candidatureId!, candidature).subscribe({
              next: () => {
                console.log("Candidature status updated to REFUSEE.");
              },
              error: (err) => {
                console.error("Erreur lors de la mise à jour de la candidature:", err);
              }
            });
          },
          error: (err) => {
            console.error("Erreur lors de la récupération de la candidature:", err);
          }
        });
      }
    },
    error: (err) => {
      console.error("Erreur lors de l'envoi du feedback:", err);
      alert("Erreur lors de l'envoi du feedback.");
    }
  });
}



}
