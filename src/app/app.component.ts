import { Component, OnInit } from '@angular/core';
import { KeycloakService } from './Services/keycloak/keycloak.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(private keycloakService: KeycloakService, private router: Router){}
  title = 'Recrutement_Front';

  userName: string = '';
  isCollapsed: boolean = false;
  
 
   async ngOnInit() {
    
    if (this.keycloakService.profile) {
      this.userName = `${this.keycloakService.profile.firstName} ${this.keycloakService.profile.lastName}`;
    } else {
      this.userName = 'Unknown User';
    }
  }
  // Toggle the collapse state
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
  async logout() {
    await this.keycloakService.logout();
  }

  get isFullPageRoute(): boolean {
    const fullPageRoutes = ['/404', '/login', '/register']; // Add more if needed
    return fullPageRoutes.includes(this.router.url);
  }
}
