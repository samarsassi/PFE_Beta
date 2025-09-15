import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { HttpClient } from '@angular/common/http';
import { EntretienService } from 'src/app/Services/fn/entretien/entretien.service';
import { KeycloakService } from 'src/app/Services/keycloak/keycloak.service';
import { Entretien, ResultatEntretien } from 'src/app/Data/Entretien';

function randomID(len: number) {
  let result = '';
  const chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP';
  const maxPos = chars.length;
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export function getUrlParams(url = window.location.href) {
  const urlStr = url.split('?')[1];
  return new URLSearchParams(urlStr);
}

@Component({
  selector: 'app-interview',
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.css']
})
export class InterviewComponent implements OnInit {
  @ViewChild('root') root!: ElementRef;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    events: [],
    eventClick: this.handleEventClick.bind(this)
  };

  userName: string = '';
  dialogVisible = false;
  dialogData: any = null;
  public nextEntretien?: Entretien;

  feedbackDialogVisible = false;
  feedbackForm = {
    commentaireRH: '',
    resultat: ''
  };

  constructor(
    private http: HttpClient,
    private entretienService: EntretienService,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    if (this.keycloakService.profile) {
      this.userName = `${this.keycloakService.profile.firstName} ${this.keycloakService.profile.lastName}`;
    }

    this.loadEntretiens();
  }

  loadEntretiens() {
    this.entretienService.getAllInterviews().subscribe({
      next: (entretiens: Entretien[]) => {
        const now = new Date();

        const futureEntretiens = entretiens
          .filter(e => new Date(e.dateEntretien) > now)
          .sort((a, b) => new Date(a.dateEntretien).getTime() - new Date(b.dateEntretien).getTime());

        this.nextEntretien = futureEntretiens[0];

        if (this.nextEntretien?.lien) {
          this.startMeeting();
        }

        this.calendarOptions = {
          ...this.calendarOptions,
          events: entretiens.map(entretien => ({
            title: `Entretien #${entretien.id} - ${entretien.resultat ?? 'N/A'}`,
            date: entretien.dateEntretien,
            extendedProps: {
              id: entretien.id,
              commentaireRH: entretien.commentaireRH,
              candidatureId: entretien.candidatureId,
              dateEntretien: entretien.dateEntretien,
              lien: entretien.lien,
              resultat: entretien.resultat,
            }
          }))
        };
      },
      error: (err) => console.error('Error loading entretiens:', err)
    });
  }

  handleEventClick(info: any) {
    this.dialogData = info.event.extendedProps;
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
    this.dialogData = null;
  }

  startMeeting() {
    const lien = this.nextEntretien?.lien;
    if (!lien) return console.error('Entretien link is not set!');

    const urlParams = new URL(lien).searchParams;
    const roomID = urlParams.get('roomID');
    if (!roomID) return console.error('roomID missing from entretien link');

    const appID = 1281385188;
    const serverSecret = 'bc38fa0eaac3667e149cf1ff21d4454d';
    const userID = randomID(8);
    const userName = this.userName || 'Invité';

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID, userID, userName);
    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: this.root.nativeElement,
      sharedLinks: [{ name: 'Personal link', url: lien }],
      scenario: { mode: ZegoUIKitPrebuilt.VideoConference },
    });
  }

  joinInterview() {
    this.root?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }

  now = new Date();

}