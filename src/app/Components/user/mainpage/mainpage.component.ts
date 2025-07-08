import { Component, HostListener, OnInit } from '@angular/core';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { Candidature } from 'src/app/Data/Candidature';

@Component({
  selector: 'app-mainpage',
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.css']
})
export class MainpageComponent implements OnInit {

  offresEmploi: any[] = [];
  isLoggedIn: boolean = false;
  userName: string = '';
  dropdownOpen: boolean = false;
  menuOpen = false;
  hasCandidatures: boolean = false;
  userCandidatures: Candidature[] = [];

  constructor(public jobService: OffreEmploiService, private keycloakService: KeycloakService, private candidatureService: CandidatureService) { }
  ngOnInit(): void {
    console.log('User profile:', this.keycloakService.profile);
    this.candidatureService.getAllCandidaturesList().subscribe((cands) => {
    });
    if (this.keycloakService.profile) {
      this.isLoggedIn = true;
      this.userName = `${this.keycloakService.profile.firstName} ${this.keycloakService.profile.lastName}`;
    } else {
      this.userName = 'Unknown User';
    }
    // Extract userId from Keycloak token (sub claim)
    const token = this.keycloakService.token;
    let userId: string | undefined = undefined;
    if (token) {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      userId = decoded.sub;
    }
    this.candidatureService.getAllCandidaturesList().subscribe((cands) => {
      if (userId) {
        this.userCandidatures = cands.filter((c: { creePar: string; }) => c.creePar === userId);
        this.hasCandidatures = this.userCandidatures.length > 0;
      } else {
        this.userCandidatures = [];
        this.hasCandidatures = false;
      }
    });
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  async logout() {
    await this.keycloakService.logout();
  }
  async ViewProfile() {
    await this.keycloakService.ViewProfile();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  hasAdminRole(): boolean {
    const userRoles = this.keycloakService.keycloak?.tokenParsed?.resource_access?.['PFE']?.roles || [];
    return userRoles.includes('admin');

  }
  // loadJobOffers() {
  //   this.jobService.getAllOffres().subscribe(
  //     (data) => {
  //       // Filter out archived offers (assuming each offer has an "archive" property which is truthy when archived)
  //       this.offresEmploi = data.filter(offre => !offre.archive);
  //       console.log(this.offresEmploi);
  //     },
  //     (error) => {
  //       console.error('Error loading job offers', error);
  //     }
  //   );
  // }

  showScrollTop = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    console.log('Scroll Y:', window.pageYOffset);
    this.showScrollTop = window.pageYOffset > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
