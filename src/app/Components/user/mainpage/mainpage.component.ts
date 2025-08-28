import { Component, HostListener, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
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

  constructor(
    public jobService: OffreEmploiService,
    private keycloakService: KeycloakService,
    private candidatureService: CandidatureService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('User profile:', this.keycloakService.profile);
    this.candidatureService.getAllCandidaturesList().subscribe((cands) => {});
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
        this.userCandidatures = cands.filter((c: { creePar: string }) => c.creePar === userId);
        this.hasCandidatures = this.userCandidatures.length > 0;
      } else {
        this.userCandidatures = [];
        this.hasCandidatures = false;
      }
    });
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    console.log('Dropdown toggled, dropdownOpen:', this.dropdownOpen);
    this.cdr.detectChanges();
  }

  async logout() {
    await this.keycloakService.logout();
  }

  async ViewProfile() {
    await this.keycloakService.ViewProfile();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
    if (!this.menuOpen) {
      this.dropdownOpen = false; // Close dropdown when menu closes
    }
    console.log('Menu toggled, menuOpen:', this.menuOpen, 'dropdownOpen:', this.dropdownOpen);
    this.cdr.detectChanges();
  }

  hasAdminRole(): boolean {
    const userRoles = this.keycloakService.keycloak?.tokenParsed?.resource_access?.['PFE']?.roles || [];
    return userRoles.includes('admin');
  }

  showScrollTop = false;

  closeMenu() {
  this.menuOpen = false;
  this.dropdownOpen = false;
  this.cdr.detectChanges();
}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.showScrollTop = window.pageYOffset > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  @ViewChild('dropdownRef', { static: false }) dropdownRef!: ElementRef;

@HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.dropdownOpen) {
      const target = event.target as HTMLElement;
      if (
        this.dropdownRef &&
        !this.dropdownRef.nativeElement.contains(target) &&
        !target.closest('.user-dropdown')
      ) {
        this.dropdownOpen = false;
        this.cdr.detectChanges();
      }
    }
    if (this.menuOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.nav-panel') && !target.closest('.menu-toggle')) {
        this.menuOpen = false;
        this.dropdownOpen = false;
        this.cdr.detectChanges();
      }
    }
  }
}