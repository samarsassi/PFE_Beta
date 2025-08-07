import { Component, inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  ValidationErrors,
  Validators,
  FormBuilder,
  FormGroup
} from '@angular/forms';
import { Router } from '@angular/router';
import { OffreEmploi } from 'src/app/Data/OffreEmploi';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';
import * as L from 'leaflet';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { Observable, Subscribable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmLocationDialog } from './confirmation-location-dialog.component'; // your custom dialog component

export function dateNotInThePast(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; // allow empty (Validators.required handles)

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0);

    return selectedDate < today ? { dateInThePast: true } : null;
  };
}

@Component({
  selector: 'app-addoffre',
  templateUrl: './addoffre.component.html',
  styleUrls: ['./addoffre.component.css']
})
export class AddoffreComponent implements OnInit {
  showMap = false;
  map: L.Map | null = null;
  offreForm: FormGroup;

  contractOptions: string[] = ['CDI', 'CDD', 'Freelance', 'Stage'];
  categoriesList: string[] = ['Tech', 'Hr', 'BI'];
  experienceLevels: string[] = ['Junior', 'Senior'];

  stepperOrientation: Observable<"horizontal" | "vertical"> | Subscribable<"horizontal" | "vertical"> | Promise<"horizontal" | "vertical">;

  constructor(
    private keycloakService: KeycloakService,
    private fb: FormBuilder,
    private offreEmploiService: OffreEmploiService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.offreForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      dateDebut: ['', [Validators.required, dateNotInThePast()]],
      contrat: ['', Validators.required],
      archive: [false],
      categories: [[], this.atLeastOneSelectedValidator],
      niveauExperience: ['', Validators.required],
      anneesExperience: ['', Validators.required],
      salaire: ['', [Validators.required, this.salaireNumberValidator]],
      localisation: ['', Validators.required]
    });

    const breakpointObserver = inject(BreakpointObserver);
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
  }

  ngOnInit(): void {
    this.initMap();
    // nav link active handling
    const linkColor = document.querySelectorAll('.nav-link');
    linkColor.forEach(link => {
      if (window.location.href.endsWith(link.getAttribute('href') || '')) {
        link.classList.add('active');
      }
      link.addEventListener('click', () => {
        linkColor.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });
  }

  openMap() {
    this.showMap = true;
    setTimeout(() => {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
      this.map = L.map('map').setView([36.8065, 10.1815], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      const customIcon = L.icon({
        iconUrl: 'assets/img/custom-marker.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });

      const marker = L.marker([36.8065, 10.1815], { icon: customIcon, draggable: true }).addTo(this.map);

      marker.on('dragend', async (event: any) => {
        const latlng = event.target.getLatLng();
        const newLocation = `${latlng.lat}, ${latlng.lng}`;
        const placeName = await this.getPlaceName(latlng.lat, latlng.lng);

        const dialogRef = this.dialog.open(ConfirmLocationDialog, {
          data: {
            title: 'Confirmer la localisation',
            message: `Voulez-vous définir la localisation sur : ${placeName} (${newLocation}) ?`
          }
        });

        dialogRef.afterClosed().subscribe(isConfirmed => {
          if (isConfirmed) {
            this.offreForm.patchValue({ localisation: placeName });
            console.log(`Location confirmed: ${placeName}`);
          } else {
            marker.setLatLng([36.8065, 10.1815]);
            console.log('Location not confirmed, marker position reset.');
          }
          this.showMap = false;
        });
      });
    }, 100);
  }

  async getPlaceName(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      return data.display_name || `Unknown Location (${lat}, ${lng})`;
    } catch (error) {
      console.error('Error fetching place name:', error);
      return `Unknown Location (${lat}, ${lng})`;
    }
  }

  initMap() {
    this.map = L.map('map').setView([36.8065, 10.1815], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const marker = L.marker([36.8065, 10.1815], { draggable: true }).addTo(this.map);
    marker.on('dragend', (event: any) => {
      const latlng = event.target.getLatLng();
      console.log(`Selected Location: ${latlng.lat}, ${latlng.lng}`);
    });
  }

   atLeastOneSelectedValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (Array.isArray(val) && val.length > 0) {
    return null;
  }
  return { required: true };
}

  salaireNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (control.value === null || control.value === undefined || control.value === '') return { required: true };
    const value = parseFloat(control.value);
    if (isNaN(value)) return { notNumber: true };
    return null;
  }

onSubmit() {
  if (this.offreForm.valid) {
    const formValue = { ...this.offreForm.value };
    formValue.salaire = parseFloat(formValue.salaire); // convert string to number

    const newOffre: OffreEmploi = formValue;

    this.offreEmploiService.createOffre(newOffre).subscribe({
      next: (res) => {
        console.log('Offre created:', res);
        this.router.navigate(['/offreEmploi/offres']);
      },
      error: (err) => {
        console.error('Error submitting offer:', err);
        alert('Erreur lors de la soumission de l\'offre.');
      }
    });
  } else {
    alert('Veuillez remplir tous les champs obligatoires.');
  }
}




  onCategoryChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const value = checkbox.value;
    const categories: string[] = this.offreForm.value.categories || [];
    if (checkbox.checked) {
      if (!categories.includes(value)) {
        this.offreForm.patchValue({ categories: [...categories, value] });
      }
    } else {
      this.offreForm.patchValue({ categories: categories.filter(cat => cat !== value) });
    }
  }

  closeMap() {
    this.showMap = false;
  }

  async logout() {
    await this.keycloakService.logout();
  }

  SeeOffre() {
    this.router.navigate(['/offreEmploi']);
  }
}
