import { AfterViewInit, ChangeDetectionStrategy, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog';
import { ViewOffreDialogComponent } from '../view-offre-dialog/view-offre-dialog.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbFlipCardComponent } from '@nebular/theme';
import * as L from 'leaflet';
import { OffreEmploi } from 'src/app/Data/OffreEmploi';
import { EditOffreDialogComponent } from './edit-offre-dialog/edit-offre-dialog.component';

@Component({
  selector: 'app-offreemploi',
  templateUrl: './offreemploi.component.html',
  styleUrls: ['./offreemploi.component.css']
})
export class OffreemploiComponent implements OnInit {
  offresEmploi: any[] = [];
  filteredOffres: any[] = [];
  showArchived: boolean = false;
  isFlipped: boolean = false;
  showMap = false;
  map!: L.Map;
  lat!: number;
  lng!: number;
  editForms: { [key: string]: FormGroup } = {};
  loading: boolean = false;

  constructor(private offreService: OffreEmploiService, private snackBar: MatSnackBar,
    public dialog: MatDialog, private fb: FormBuilder,) { }



  ngOnInit(): void {
    this.loadJobOffers();
  }

  loadJobOffers() {
    this.loading = true;
    this.offreService.getAllOffres().subscribe(
      (data) => {
        this.offresEmploi = data;
        this.filterOffres();
        this.loading = false;
        console.log(data)
      },
      (error) => {
        console.error('Error loading job offers', error);
        this.loading = false;
      }
    );
  }

  trackByOffreId(index: number, offre: any): number {
    return offre.id;
  }

  filterOffres() {
    this.filteredOffres = this.offresEmploi.filter(offre =>
      this.showArchived ? offre.archive : !offre.archive
    );
    console.log("Filtered Offers:", this.filteredOffres);
  }

  isOfferEnded(offre: any): boolean {
    const today = new Date();
    const startDate = new Date(offre.dateDebut);
    // If start date is before today, offer is ended
    return startDate < today;
  }

  isOfferDelayed(offre: any): boolean {
    const today = new Date();
    const startDate = new Date(offre.dateDebut);
    // If start date is in the future, offer is delayed (not started yet)
    return startDate > today;
  }


  onDelete(id: number, cancelCallback: () => any = () => { }) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '250px',
      data: { message: 'Voulez-vous vraiment supprimer cette offre ?', title: 'Confirmation de suppression' },
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.offreService.deleteOffre(id).subscribe({
          next: () => {
            this.loadJobOffers();
            this.openSnackBar('Offre supprimée avec succès', 'X', 'success-snackbar', 5000);
            console.log(`Offre avec l'id ${id} supprimée avec succès.`);
          },
          error: (err) => {
            console.error('Erreur lors de la suppression de l\'offre :', err);
            this.openSnackBar('Échec de la suppression de l\'offre', 'X', 'error-snackbar', 3000);
          }
        });
      } else {
        cancelCallback();
        this.openSnackBar('Suppression annulée', 'X', 'error-snackbar', 5000);
      }
    });
  }



  openEditDialog(offre: OffreEmploi): void {
    const dialogRef = this.dialog.open(EditOffreDialogComponent, {
      width: '600px',
      data: { offre }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.offreService.updateOffre(result.id, result).subscribe(() => {
          console.log('Updated successfully');
          this.loadJobOffers(); // 🔁 Reload here after update
        });
      }
    });
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

  flipCardBack(event: MouseEvent, flipCard: NbFlipCardComponent) {
    flipCard.toggle();

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 300);
  }


  onConfigClick(event: MouseEvent, flipCard: NbFlipCardComponent, id: number, loc: string): void {
    event.stopPropagation();
    this.showMap = true;
    flipCard.toggle();

    // Only load the map if there is a location
    if (loc) {

      console.log(loc);

      this.getCoordinates("Paris, France")
        .then(({ lat, lng }) => console.log("Static coords:", lat, lng))
        .catch(console.error);

      this.getCoordinates(loc)
        .then(({ lat, lng }) => {
          this.lat = lat;
          this.lng = lng;
          console.log(lat, lng);

          // Reinitialize the map only after the coordinates are available
          this.initMap();

          this.openMap((newLoc: string) => {
            if (newLoc) {
              this.editForms[id].patchValue({ localisation: newLoc });
            }
          });
        })
        .catch(error => {
          console.error("Error fetching initial coordinates:", error);
        });
    }
  }


  onArchive(offreId: number, cancelCallback: () => any = () => { }) {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      width: '300px',
      data: {
        message: 'Voulez-vous vraiment changer le statut d\'archivage de cette offre ?',
        title: 'Confirmer Archivage/Désarchivage'
      },
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.offreService.getOffreById(offreId).subscribe(offre => {
          const updatedOffre = { ...offre, archive: !offre.archive };
          this.offreService.updateOffre(offreId, updatedOffre).subscribe({
            next: () => {
              this.openSnackBar(
                `Offre ${updatedOffre.archive ? 'archivée' : 'désarchivée'} !`,
                'X',
                'info-snackbar'
              );
              this.loadJobOffers();
            },
            error: (err) => {
              console.error('Erreur lors de l\'archivage de l\'offre :', err);
              this.openSnackBar('Erreur lors de l\'archivage de l\'offre', 'X', 'error-snackbar');
            }
          });
        });
      } else {
        cancelCallback();
        this.openSnackBar('Action d\'archivage annulée', 'X', 'error-snackbar');
      }
    });
  }



  async getCoordinates(address: string): Promise<{ lat: number, lng: number }> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        return { lat, lng };
      } else {
        throw new Error("Coordinates not found");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      throw new Error("Failed to fetch coordinates");
    }
  }



  openMap(onLocationSelected: (placeName: string) => void) {
    console.log("Opening map...");

    if (this.map) {
      // If the map already exists, just update the view
      this.map.setView([this.lat, this.lng], 13);
      return;
    }
    // If the map doesn't exist, initialize it
    // this.showMap = true;
    setTimeout(() => {
      console.log("Initializing map...");
      this.map = L.map('map').setView([this.lat, this.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      const customIcon = L.icon({
        iconUrl: 'assets/img/custom-marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([this.lat, this.lng], { icon: customIcon, draggable: true }).addTo(this.map);

      let newLocation: string = '';

      marker.on('dragend', async (event: any) => {
        const latlng = event.target.getLatLng();
        newLocation = `${latlng.lat}, ${latlng.lng}`;

        const placeName = await this.getPlaceName(latlng.lat, latlng.lng);

        const isConfirmed = window.confirm(`Do you want to set the location to: ${placeName} (${newLocation})?`);

        if (isConfirmed) {
          onLocationSelected(placeName);
          console.log(`Location confirmed: ${placeName}`);
        } else {
          marker.setLatLng([this.lat, this.lng]);
          console.log('Location not confirmed, marker position reset.');
        }
      });
    }, 100);
  }


  initMap() {
    if (this.map) {
      this.map.remove();
    }
    this.map = L.map('map').setView([this.lat, this.lng], 13); // Default loc

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    const customIcon = L.icon({
      iconUrl: 'assets/img/custom-marker.png',  // Path to your PNG image
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
    const marker = L.marker([this.lat, this.lng], { icon: customIcon, draggable: false }).addTo(this.map);
    marker.on('dragend', (event: any) => {
      const latlng = event.target.getLatLng();
      console.log(`Selected Location: ${latlng.lat}, ${latlng.lng}`);
    });
  }

  // Reverse Geocoding Function using OpenStreetMap's Nominatim API
  async getPlaceName(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();

      if (data.display_name) {
        return data.display_name;
      } else {
        return `Unknown Location (${lat}, ${lng})`; // Fallback if no name is found
      }
    } catch (error) {
      console.error("Error fetching place name:", error);
      return `Unknown Location (${lat}, ${lng})`;
    }
  }



  onViewOffer(selectedOfferId: number): void {
    if (this.map) {
      this.map.remove();
    }
    this.offreService.getOffreById(selectedOfferId).subscribe(
      (viewoffer) => {
        this.dialog.open(ViewOffreDialogComponent, {
          data: viewoffer
        });
      },
      (error) => {
        console.error('Error fetching offer:', error);
      }
    );

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


