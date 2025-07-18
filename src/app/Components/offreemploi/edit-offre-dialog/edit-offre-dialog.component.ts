import { Component, Inject } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OffreEmploi } from 'src/app/Data/OffreEmploi';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';

@Component({
  selector: 'app-edit-offre-dialog',
  templateUrl: './edit-offre-dialog.component.html',
  styleUrls: ['./edit-offre-dialog.component.css']
})
export class EditOffreDialogComponent {
  editForm: FormGroup;
  offresEmploi: any[] = [];
  filteredOffres: any[] = [];
  showArchived: boolean = false;

  constructor(
    private fb: FormBuilder,
    private offreService: OffreEmploiService,
    public dialogRef: MatDialogRef<EditOffreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { offre: OffreEmploi }
  ) {
    this.editForm = this.fb.group({
      titre: [data.offre.titre, Validators.required],
      localisation: [data.offre.localisation, Validators.required],
      description: [data.offre.description, Validators.required],
      salaire: [data.offre.salaire, Validators.required],
      dateDebut: [data.offre.dateDebut, Validators.required],
      archive: [data.offre.archive]
    });
  }

   loadJobOffers() {
    this.offreService.getAllOffres().subscribe(
      (data) => {
        this.offresEmploi = data;
        this.filterOffres();
        console.log(data)
      },
      (error) => {
        console.error('Error loading job offers', error);
      }
    );
  }
    filterOffres() {
    this.filteredOffres = this.offresEmploi.filter(offre =>
      this.showArchived ? offre.archive : !offre.archive
    );
    console.log("Filtered Offers:", this.filteredOffres);
  }
  
  onSave() {
    if (this.editForm.valid) {
      const updatedOffre = { ...this.data.offre, ...this.editForm.value };
          this.offreService.updateOffre(updatedOffre.id, updatedOffre).subscribe({
      next: (res) => {
        console.log('Updated successfully', res);
        this.loadJobOffers();
        this.dialogRef.close(updatedOffre); // Return the updated offer

      },
      error: (err) => {
        console.error('Update failed', err);
        // handle error (show message, etc)
      }
    });

    }
  }


  onCancel() {
    this.dialogRef.close();
  }
}

