import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { OffreEmploi } from 'src/app/Data/OffreEmploi';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';
import * as L from 'leaflet';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { Observable, Subscribable } from 'rxjs';
import { BreakpointObserver } from '@angular/cdk/layout';
import {map} from 'rxjs/operators';


export function dateNotInThePast(): (control: AbstractControl) => ValidationErrors | null {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null; // Allow empty values (handled by `Validators.required`)

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to 00:00:00

    const selectedDate = new Date(control.value);
    selectedDate.setHours(0, 0, 0, 0); // Reset selected date time to 00:00:00

    return selectedDate < today ? { 'dateInThePast': true } : null;
  };
}


@Component({
  selector: 'app-addoffre',
  templateUrl: './addoffre.component.html',
  styleUrls: ['./addoffre.component.css']
})
export class AddoffreComponent  implements OnInit {
  showMap = false;
  map: any;
  offreForm: FormGroup;
//stepper part//
  private _formBuilder = inject(FormBuilder);
  contractOptions: string[] = ['CDI', 'CDD', 'Freelance', 'Stage'];
  categoriesList: string[] = ['Tech','Hr','BI'];
  experienceLevels: string[] = ['Junior', 'Senior'];
stepperOrientation: Observable<"horizontal"|"vertical">|Subscribable<"horizontal"|"vertical">|Promise<"horizontal"|"vertical">;
  constructor(private keycloakService: KeycloakService,private fb: FormBuilder,private offreEmploiService: OffreEmploiService,private router: Router) {
    
    this.offreForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      dateDebut: ['',  [Validators.required, dateNotInThePast()]],
      contrat: ['', Validators.required],
      archive: [false],
      categories: [[], Validators.required],
      niveauExperience: ['', Validators.required],
      salaire: ['', Validators.required],
      localisation: ['', Validators.required]
    });
    const breakpointObserver = inject(BreakpointObserver);

    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({matches}) => (matches ? 'horizontal' : 'vertical')));
  }
  
  ngOnInit(): void {
    this.initMap();
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

  // Open the map modal
  openMap() {
    this.showMap = true;
    setTimeout(() => {
      this.map = L.map('map').setView([36.8065, 10.1815], 13); // Default to Tunis
  
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
  
      // Custom icon for the marker
      const customIcon = L.icon({
        iconUrl: 'assets/img/custom-marker.png',  // Path to your PNG image
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
  
      // Add the marker with the custom icon
      const marker = L.marker([36.8065, 10.1815], { icon: customIcon, draggable: true }).addTo(this.map);
      
      let newLocation: string = ''; // Store the new location
  
      marker.on('dragend', async (event: any) => {
        const latlng = event.target.getLatLng();
        newLocation = `${latlng.lat}, ${latlng.lng}`; // Store the new location
  
        // Call the reverse geocoding API
        const placeName = await this.getPlaceName(latlng.lat, latlng.lng);
        
        // Show confirmation dialog with the place name
        const isConfirmed = window.confirm(`Do you want to set the location to: ${placeName} (${newLocation})?`);
  
        if (isConfirmed) {
          // If confirmed, update the form control value with the place name
          this.offreForm.patchValue({ localisation: placeName });
          console.log(`Location confirmed: ${placeName}`);
        } else {
          // If not confirmed, reset the marker position
          marker.setLatLng([36.8065, 10.1815]); 
          console.log('Location not confirmed, marker position reset.');
        }
  
        this.showMap = false; // Hide the map after confirmation
      });
    }, 100);
  }
  
  // Reverse Geocoding Function using OpenStreetMap's Nominatim API
  async getPlaceName(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name; // Full address name
      } else {
        return `Unknown Location (${lat}, ${lng})`; // Fallback if no name is found
      }
    } catch (error) {
      console.error("Error fetching place name:", error);
      return `Unknown Location (${lat}, ${lng})`; 
    }
  }
  

  initMap() {
    // Optionally initialize a map if needed before showing it (e.g. for a default view)
    this.map = L.map('map').setView([36.8065, 10.1815], 13); // Default to Tunis

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const marker = L.marker([36.8065, 10.1815], { draggable: true }).addTo(this.map);
    marker.on('dragend', (event: any) => {
      const latlng = event.target.getLatLng();
      console.log(`Selected Location: ${latlng.lat}, ${latlng.lng}`);
    });
  }

  onSubmit() {
    console.log('Submit clicked');
    if (this.offreForm.valid) {
      const newOffre: OffreEmploi = { ...this.offreForm.value };
      
      console.log("Form Values Before Sending:", newOffre); // Debugging
  
      this.offreEmploiService.createOffre(newOffre).subscribe(
        response => {
          console.log('Response from Backend:', response);
          alert('Offre submitted successfully!');
          this.router.navigate(['/offreEmploi/offres']);
        },
        error => {
          console.error('Error submitting offer:', error);
          alert('Failed to submit offer.');
        }
      );
    } else {
      alert('Please fill all required fields.');
    }
  }
  async logout() {
    await this.keycloakService.logout();
  }
  SeeOffre(){
    this.router.navigate(['/offreEmploi']);
  }

}