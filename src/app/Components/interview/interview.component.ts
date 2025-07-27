import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { HttpClient } from '@angular/common/http';
import { EntretienService } from 'src/app/Services/fn/entretien/entretien.service';
import { Entretien } from 'src/app/Data/Entretien';


function randomID(len:number) {
  let result = '';
  if (result) return result;
  var chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP',
    maxPos = chars.length,
    i;
  len = len || 5;
  for (i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

export function getUrlParams(
  url = window.location.href
) {
  let urlStr = url.split('?')[1];
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
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],  // <-- plugins here
    events: [], // will be populated later
    eventClick: this.handleEventClick.bind(this)
  };

  constructor(private http: HttpClient, private entretienService: EntretienService) {}
 ngOnInit(): void {
   this.entretienService.getAllChallenges().subscribe({
  next: (entretiens: Entretien[]) => {
    console.log('Raw entretiens:', entretiens);

    const events = entretiens.map(entretien => {
      console.log('Mapping entretien:', entretien);
      return {
        title: `Entretien #${entretien.id} - ${entretien.resultat}`,
        date: entretien.dateEntretien,
        extendedProps: {
          commentaireRH: entretien.commentaireRH,
          candidatureId: entretien.candidatureId,
          resultat: entretien.resultat,
        }
      };
    });

    console.log('Mapped events:', events); // 🟢 See how many events you actually generate

    this.calendarOptions = {
      ...this.calendarOptions,
      events: events,
    };
  },
  error: (err) => console.error('Error loading entretiens:', err)
});

  }

  handleEventClick(info: any) {
    const { commentaireRH, resultat, candidatureId } = info.event.extendedProps;
    alert(
      `Entretien details:\n` +
      `Candidature ID: ${candidatureId}\n` +
      `Resultat: ${resultat}\n` +
      `Commentaire RH: ${commentaireRH}`
    );
  }

  ngAfterViewInit() {
    const roomID = getUrlParams().get('roomID') || randomID(5);

    // generate Kit Token
    const appID = 591667673;
    const serverSecret = "43f6a8d22a15d8a6465dd4c1ad7a53a7";
    const kitToken =  ZegoUIKitPrebuilt.generateKitTokenForTest(appID, serverSecret, roomID,  randomID(5),  randomID(5));

    
    // Create instance object from Kit Token.
    const zp = ZegoUIKitPrebuilt.create(kitToken);

 
    // Start a call.
    zp.joinRoom({
        container: this.root.nativeElement,
        sharedLinks: [
          {
            name: 'Personal link',
            url:
              window.location.protocol + '//' + 
              window.location.host + window.location.pathname +
              '?roomID=' +
              roomID,
          },
        ],
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
    });
  }
}