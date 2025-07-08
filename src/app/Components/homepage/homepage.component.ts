import { Component, Inject, OnInit } from '@angular/core';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { 
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { OffreEmploi } from 'src/app/Data/OffreEmploi';
import { Candidature } from 'src/app/Data/Candidature';
import { Color, ScaleType } from '@swimlane/ngx-charts';
import { forkJoin, map } from 'rxjs';
import { CodingChallenge } from 'src/app/Data/coding-challenge.model';
import { ChallengeService } from 'src/app/Services/fn/challenge/challenge-service.service';

@Component({
  selector: 'app-homepage',
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent implements OnInit {
  constructor(private keycloakService: KeycloakService, private dialog: MatDialog, 
    private offreService: OffreEmploiService, private candidatureService: CandidatureService,
    private challengeService: ChallengeService){}

  userName: string = '';
  users: any[] = [];
 userRoles: any[] = [];
    selectedUser: any;
    availableRoles: any[] = [];
    onlineUserIds: string[] = [];
    searchQuery: string = '';
    adminUserCount: number = 0;
    rolesCountValue: number = 0;
    usersConnectedToday:  number = 0;
    offres: OffreEmploi[] = [];
    candidatures: Candidature[] = [];
    defis: CodingChallenge[] = [];
    loadingChart: boolean = true;
    chartDataUsers: any[] = [];
    chartDataOffres: any[] = [];
    chartDataCandidatures: any[] = [];
    chartDataCandidaturesPerOffre: any[] = [];
    offre: OffreEmploi | undefined;
    originalCandidatureChartData: any[] = [];
    customColorsMap: { [name: string]: string } = {};


     colorScheme: Color = {
    name: 'customScheme',
    selectable: true,
    group: ScaleType.Ordinal, 
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };
    

        async ngOnInit() {
          if (this.keycloakService.profile) {
            this.userName = `${this.keycloakService.profile.firstName} ${this.keycloakService.profile.lastName}`;
          } else {
            this.userName = 'Unknown User';
          }
          this.users = (await this.keycloakService.getAllUsers()) ?? [];
          this.onlineUserIds = await this.keycloakService.getOnlineUsers();
          this.rolesCountValue = (await this.keycloakService.getAvailableClientRoles()).length;
          this.usersConnectedToday = (await this.keycloakService.getLoginUsersToday());
          this.loadOffres();
          this.loadCandidatures();
          this.loadOffresWithCandidatureCounts();
          this.loadDefis();

        }
      
      loadOffres() {
        this.offreService.getAllOffres().subscribe(data => {
          console.log('Raw Offres:', data);

          this.offres = data;

          const grouped = this.offres.reduce((acc, offre) => {
            acc[offre.titre] = (acc[offre.titre] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          console.log('Grouped Offres:', grouped);

          this.chartDataOffres = Object.entries(grouped).map(([name, count]) => ({
            name,
            value: count
          }));

          console.log('Chart Data Offres:', this.chartDataOffres);
        });
      }

      

      loadCandidatures() {
        this.candidatureService.getAllCandidaturesList().subscribe(data => {
          this.candidatures = data;
          this.loadCandidaturesChartData();  // separate chart for candidatures
        });
      }
      loadDefis() {
        this.challengeService.getAllChallenges().subscribe(data => {
          this.defis = data;
        });
      }

      loadOffresWithCandidatureCounts() {
  this.offreService.getAllOffres().subscribe(offres => {
    this.offres = offres;

    const requests = offres.map(offre =>
      this.offreService.getCandidaturesForOffre(offre.id).pipe(
        map((candidatures: Candidature[]) => ({
          name: offre.titre,
          value: candidatures.length
        }))
      )
    );

    forkJoin(requests).subscribe(results => {
      this.originalCandidatureChartData = results;

      // Default color mapping
      this.customColorsMap = results.reduce((acc, entry) => {
        acc[entry.name] = '#5AA454';
        return acc;
      }, {} as Record<string, string>);

      this.chartDataCandidaturesPerOffre = [...results];
    });
  });
      }
      
      async loadUsersData() {
          this.users = (await this.keycloakService.getAllUsers()) ?? [];
          this.onlineUserIds = await this.keycloakService.getOnlineUsers();
          this.rolesCountValue = (await this.keycloakService.getAvailableClientRoles()).length;
          this.usersConnectedToday = (await this.keycloakService.getLoginUsersToday());
          this.loadUsersChartData();  // separate chart for users
        }


    loadUsersChartData() {
      this.chartDataUsers = [
        { name: 'Total utilisateurs', value: this.users.length },
        { name: 'Connectés aujourd’hui', value: this.usersConnectedToday },
        { name: 'Admins & Responsables', value: this.rolesCountValue }
      ];
    }

    loadOffresChartData() {
      this.chartDataOffres = [
        { name: 'Nombre d\'offres', value: this.offres?.length ?? 0 }
      ];
    }

    loadCandidaturesChartData() {
      this.chartDataCandidatures = [
        { name: 'Nombre de candidatures', value: this.candidatures?.length ?? 0 }
      ];
    }


      get activeUserCount(): number {
      return this.users.filter(user => this.onlineUserIds.includes(user.id)).length;
    }


    filteredUsers() {
      return this.users.filter(user =>
        (user.firstName + ' ' + user.lastName + ' ' + user.email)
          .toLowerCase()
          .includes(this.searchQuery.toLowerCase())
      );
    }


    async onSelectUser(user: any) {
      this.selectedUser = user;
      this.userRoles = await this.keycloakService.getUserRoles(user.id);
      this.availableRoles = await this.keycloakService.getAvailableClientRoles();
    }
    async rolesCount(): Promise<number> {

  return await (await this.keycloakService.getAvailableClientRoles()).length;
}


    async assignRole(role: any) {
      if (!this.selectedUser) return;
      await this.keycloakService.assignClientRoleToUser(this.selectedUser.id, role);
       this.userRoles = await this.keycloakService.getUserRoles(this.selectedUser.id);
    }
    async removeRole(role: any) {
      if (!this.selectedUser) return;

      const userId = this.selectedUser.id;
      const clientId = await this.keycloakService.getClientUUID(); // or your equivalent method

      await this.keycloakService.removeClientRoleFromUser(userId,  role);
      this.userRoles = await this.keycloakService.getUserRoles(this.selectedUser.id);

    }

    async confirmAssignRole(role: any) {
      const dialogRef = this.dialog.open(RoleConfirmationDialog, {
        width: '370px',
        data: {
          title: `Attribuer le rôle "${role.name}" ?`,
          message: `Êtes-vous sûr de vouloir attribuer ce rôle à ${this.selectedUser.firstName} ?`
        }
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (result) {
        await this.assignRole(role);
      }
    }

    async confirmRemoveRole(role: any) {
      const dialogRef = this.dialog.open(RoleConfirmationDialog, {
        width: '370px',
        data: {
          title: `Retirer le rôle "${role.name}" ?`,
          message: `Êtes-vous sûr de vouloir retirer ce rôle de ${this.selectedUser.firstName} ?`
        }
      });

      const result = await dialogRef.afterClosed().toPromise();
      if (result) {
        await this.removeRole(role);
      }
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
      <p class="dialog-message">{{ data.message }}</p>
      <div class="dialog-actions">
        <button class="cancel-button" (click)="onNoClick()">Cancel</button>
        <button class="ok-button" (click)="onYesClick()">Ok</button>
      </div>
    </div>


    
    `,styleUrls: ['./roleconfirmation-dialog.component.css']
  })
  export class RoleConfirmationDialog {
    constructor(
      public dialogRef: MatDialogRef<RoleConfirmationDialog>,
      @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) { }
  
    onNoClick(): void {
      this.dialogRef.close(false);
    }
  
    onYesClick(): void {
      this.dialogRef.close(true);
    }
  }