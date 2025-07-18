import { HttpClient } from '@angular/common/http';
import { Component, HostListener, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarAction, MatSnackBarActions, MatSnackBarLabel, MatSnackBarRef } from '@angular/material/snack-bar';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import * as L from 'leaflet';
import { filter } from 'rxjs';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { initializeApp } from 'firebase/app';
import { environment } from 'src/environments/environment';



@Component({
  selector: 'app-view-offre',
  templateUrl: './view-offre.component.html',
  styleUrls: ['./view-offre.component.css'],

})
export class ViewOffreComponent implements OnInit {
  offresEmploi: any[] = [];
  selectedOffre: any;
  isModalOpen = false;
  selectedFile: File | null = null;
  //map
  map!: L.Map;
  lat!: number;
  lng!: number;
  //search
  searchQuery: string = '';
  filteredResults: any[] = [];
  search = false;

  // Filters
  showFilters: boolean = false;
  contrats: string[] = [];
  niveaux: string[] = [];
  selectedContrat: string = '';
  selectedNiveau: string = '';
  salaireSlider: number = 0;
  selectedDate: string = '';

  applyForm!: FormGroup;
  file!: File;
  shortLink: string = "";
  loading: boolean = false;

  private _snackBar = inject(MatSnackBar);
  durationInSeconds = 5;

  firebaseApp = initializeApp(environment.firebaseConfig);
  storage = getStorage(this.firebaseApp);

  constructor(private http: HttpClient, public jobService: OffreEmploiService, public candidatureService: CandidatureService, private route: ActivatedRoute, private router: Router, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.loadJobOffers();
    this.loadSelectedOffre();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.loadSelectedOffre();
    });

    //application
    this.applyForm = this.fb.group({
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      cv: ['', Validators.required],
      experience: ['', [Validators.required, Validators.min(0)]],
      portfolioURL: [''],
      linkedInProfile: [''],
      coverLetter: [''],
      statut: ['EN ATTENTE']
    });

  }

  loadSelectedOffre() {
    const selectedId = this.route.snapshot.paramMap.get('id');
    const id = selectedId ? +selectedId : null;

    if (id !== null) {
      this.jobService.getOffreById(id).subscribe(
        (data) => {
          this.selectedOffre = data;
          console.log('Selected offre:', this.selectedOffre);

          if (this.map) {
            this.map.remove();
          }

          if (this.selectedOffre.localisation) {
            this.getCoordinates(this.selectedOffre.localisation)
              .then(({ lat, lng }) => {
                this.lat = lat;
                this.lng = lng;
                this.initMap();
              })
              .catch(error => {
                console.error("Error retrieving coordinates:", error);
              });
          }
        },
        (error) => {
          console.error('Error fetching the selected offer:', error);
        }
      );
    }
  }



  loadJobOffers() {
    this.jobService.getAllOffres().subscribe(
      (data) => {
        this.offresEmploi = data.filter(offre => !offre.archive);
        // Populate contrats and niveaux from data
        this.contrats = Array.from(new Set(this.offresEmploi.map(o => o.contrat).filter(Boolean)));
        this.niveaux = Array.from(new Set(this.offresEmploi.map(o => o.niveauExperience).filter(Boolean)));
        console.log(this.offresEmploi);
      },
      (error) => {
        console.error('Error loading job offers', error);
      }
    );
  }

  searchJobs() {
    const query = this.searchQuery.toLowerCase().trim();
    if (!query) {
      this.applyFilters();
      return;
    }
    this.filteredResults = this.offresEmploi.filter(offre =>
      (offre.titre && offre.titre.toLowerCase().includes(query)) ||
      (offre.localisation && offre.localisation.toLowerCase().includes(query)) ||
      (offre.description && offre.description.toLowerCase().includes(query))
    );
    this.applyFilters(true);
  }

  toggleFilter(type: string, value: string) {
    if (type === 'contrat') {
      this.selectedContrat = this.selectedContrat === value ? '' : value;
    }
    if (type === 'niveau') {
      this.selectedNiveau = this.selectedNiveau === value ? '' : value;
    }
    this.applyFilters();
  }

  clearAllFilters() {
    this.selectedContrat = '';
    this.selectedNiveau = '';
    this.salaireSlider = 0;
    this.selectedDate = '';
    this.applyFilters();
  }

  applyFilters(fromSearch: boolean = false) {
    let filtered = this.offresEmploi;
    // Contrat
    if (this.selectedContrat) {
      filtered = filtered.filter(o => o.contrat === this.selectedContrat);
    }
    // Niveau d'expérience
    if (this.selectedNiveau) {
      filtered = filtered.filter(o => o.niveauExperience === this.selectedNiveau);
    }
    // Salaire slider
    if (this.salaireSlider) {
      filtered = filtered.filter(o => parseFloat(o.salaire) >= this.salaireSlider);
    }
    // Date début
    if (this.selectedDate) {
      filtered = filtered.filter(o => o.dateDebut && o.dateDebut >= this.selectedDate);
    }
    // If called from search, intersect with search results
    if (fromSearch && this.searchQuery) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(offre =>
        (offre.titre && offre.titre.toLowerCase().includes(query)) ||
        (offre.localisation && offre.localisation.toLowerCase().includes(query)) ||
        (offre.description && offre.description.toLowerCase().includes(query))
      );
    }
    this.filteredResults = filtered;
  }


  viewOffre(id: string) {
    this.router.navigate(['/main/offre', id]);
  }



  openModal() {
    this.isModalOpen = true;
  }
  onChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.applyForm.patchValue({ cv: file });
      this.applyForm.get('cv')?.updateValueAndValidity();
    }
  }
  submitApplication(): void {
    const selectedId = this.route.snapshot.paramMap.get('id');
    const id = selectedId ? +selectedId : null;

    if (this.applyForm.valid && id !== null) {
      // Upload CV file to Firebase (test)
      const cvFile = this.applyForm.value.cv;
      if (cvFile instanceof File) {
        this.uploadCvFile(cvFile);
      } else {
        console.warn('No valid CV file to upload');
      }

      // Keep old logic
      const formData = new FormData();

      formData.append('nom', this.applyForm.value.nom);
      formData.append('email', this.applyForm.value.email);
      formData.append('phone', this.applyForm.value.phone);
      formData.append('experience', this.applyForm.value.experience);
      formData.append('portfolioURL', this.applyForm.value.portfolioURL || '');
      formData.append('linkedInProfile', this.applyForm.value.linkedInProfile || '');
      formData.append('coverLetter', this.applyForm.value.coverLetter || '');
      formData.append('statut', this.applyForm.value.statut);
      formData.append('cv', this.applyForm.value.cv);
      formData.append('offreEmploiId', id.toString());

      this.candidatureService.createCandidature(formData).subscribe(
        response => {
          console.log('Response from Backend:', response);
          this._snackBar.openFromComponent(SnackBarAnnotatedComponent, {
            duration: this.durationInSeconds * 1000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
          });
          this.router.navigate(['/main']);
        },
        error => {
          console.error('Error submitting candidature:', error);
          alert('Failed to submit application.');
        }
      );
    } else {
      alert('Please fill all required fields.');
    }
  }

  uploadCvFile(file: File): void {
    const filePath = `CVs/${this.applyForm.value.nom}_${Date.now()}.${file.name.split('.').pop()}`;

    const storageRef = ref(this.storage, `cvs/${filePath}`);

    uploadBytes(storageRef, file).then((snapshot) => {
      console.log('Uploaded a file!', snapshot);

      // Optional: get download URL
      getDownloadURL(storageRef).then((url) => {
        console.log('File available at', url);
      });
    }).catch(error => {
      console.error('Upload failed:', error);
    });
  }

  closeModal() {
    this.isModalOpen = false;
  }

  scrollLeft() {
    const jobList = document.querySelector('.job-list') as HTMLElement;
    jobList.scrollLeft -= 300; // Scrolls 300px to the left (adjust as needed)
  }

  scrollRight() {
    const jobList = document.querySelector('.job-list') as HTMLElement;
    jobList.scrollLeft += 300; // Scrolls 300px to the right (adjust as needed)
  }

  selectOffre(offre: any) {
    this.selectedOffre = offre;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  //map
  initMap() {
    // Optionally initialize a map if needed before showing it (e.g. for a default view)
    this.map = L.map('map').setView([this.lat, this.lng], 13); // Default to Tunis

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
}

@Component({
  templateUrl: `snack-bar-annotated-component-example-snack.html`,
  styles: [`
      .snack-bar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      background-color: green;
    }

    .candidature {
      flex: 1;
      color: white;
      font-weight: bold;
    }

    [matSnackBarActions] button {
      font-weight: bold;
      color: red;
    }

  `]
})
export class SnackBarAnnotatedComponent {
  snackBarRef = inject(MatSnackBarRef);
}
