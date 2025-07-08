import { Component, OnInit } from '@angular/core';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  constructor(private keycloakService: KeycloakService){}
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
  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
  async logout() {
    await this.keycloakService.logout();
  }
  async ViewProfile(){
    await this.keycloakService.ViewProfile();
  }
}
