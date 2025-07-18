import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';

@Component({
  selector: 'app-maincontent',
  templateUrl: './maincontent.component.html',
  styleUrls: ['./maincontent.component.css']
})
export class MaincontentComponent implements OnInit, AfterViewInit {

  offresEmploi: any[] = [];
  filteredOffres: any[] = [];
  searchQuery: string = '';
  selectedSalaire: string = '';
  selectedDate: string = '';
  selectedContrat: string = '';
  selectedNiveau: string = '';
  contrats: string[] = [];
  niveaux: string[] = [];
  showFilters: boolean = false;
  salaireSlider: number = 0;

  constructor(public jobService: OffreEmploiService, private route: ActivatedRoute) { }
  ngOnInit(): void {
    this.loadJobOffers();
  }


  ngAfterViewInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  loadJobOffers() {
    this.jobService.getAllOffres().subscribe(
      (data) => {
        this.offresEmploi = data.filter(offre => !offre.archive).reverse();
        this.filteredOffres = this.offresEmploi;
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
    this.filteredOffres = this.offresEmploi.filter(offre =>
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
    this.filteredOffres = filtered;
  }
  scrollLeft() {
    const jobList = document.querySelector('.job-list') as HTMLElement;
    jobList.scrollLeft -= 300; // Scrolls 300px to the left (adjust as needed)
  }

  scrollRight() {
    const jobList = document.querySelector('.job-list') as HTMLElement;
    jobList.scrollLeft += 300; // Scrolls 300px to the right (adjust as needed)
  }
}
