import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EntretienService } from 'src/app/Services/fn/entretien/entretien.service';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { Candidature } from 'src/app/Data/Candidature';

@Component({
  selector: 'app-interview-user',
  templateUrl: './interview-user.component.html',
  styleUrls: ['./interview-user.component.css']
})
export class InterviewUserComponent implements OnInit {
  @ViewChild('root') root!: ElementRef;
  
  candidatureId!: string;
  entretienLink: string = '';
  userName: string = '';
  public candidature!: Candidature;
  public entretienDate!: string;

  constructor(
    private route: ActivatedRoute,
    private candidatureService: CandidatureService,
    private keycloakService: KeycloakService
  ) {}

ngOnInit() {
  if (this.keycloakService.profile) {
            this.userName = `${this.keycloakService.profile.firstName} ${this.keycloakService.profile.lastName}`;
          }
  const candidatureIdStr = this.route.snapshot.queryParamMap.get('candidatureId');
  if (!candidatureIdStr) {
    console.error('No candidatureId provided');
    return;
  }

  // Convert to number
  const candidatureId = Number(candidatureIdStr);
  if (isNaN(candidatureId)) {
    console.error('Invalid candidatureId:', candidatureIdStr);
    return;
  }

  this.candidatureService.getCandidatureById(candidatureId).subscribe({
    next: (candidature) => {
      this.candidature = candidature; // ✅ assign it to a class variable
      this.entretienLink = candidature.entretien?.lien || '';
      this.entretienDate = candidature.entretien?.dateEntretien || '';
      this.startInterview();
    },
    error: (err) => console.error('Failed to fetch candidature', err),
  });

  
}
ngAfterViewInit(): void {
  if (this.entretienLink) {
    this.startInterview();
  }
}


  startInterview() {
    if (!this.entretienLink) {
      console.error('No entretien link found on candidature');
      return;
    }

    // Extract roomID from entretienLink URL
    const urlParams = new URL(this.entretienLink).searchParams;
    const roomID = urlParams.get('roomID');
    if (!roomID) {
      console.error('roomID missing from entretien link');
      return;
    }

    const appID = 1281385188;
    const serverSecret = 'bc38fa0eaac3667e149cf1ff21d4454d';
    const userID = this.randomID(5);

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, userID, this.userName);
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: this.root.nativeElement,
      sharedLinks: [
        {
          name: 'Interview link',
          url: this.entretienLink,
        },
      ],
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
    });
  }

  randomID(len: number): string {
    let result = '';
    const chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
