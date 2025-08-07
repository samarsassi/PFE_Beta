import { AfterViewInit, Component, ElementRef, Inject, ViewChild, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EntretienService } from 'src/app/Services/fn/entretien/entretien.service';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

import { CalendarOptions, DateSelectArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Entretien } from 'src/app/Data/Entretien';
import { CandidatureService } from 'src/app/Services/fn/candidature/candidature.service';

function randomID(len: number) {
  let result = '';
  const chars = '12345qwertyuiopasdfgh67890jklmnbvcxzMNBVCZXASDQWERTYHGFUIOLKJP';
  const maxPos = chars.length;
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * maxPos));
  }
  return result;
}

@Component({
  selector: 'app-create-entretien-dialog',
  templateUrl: './create-entretien-dialog.component.html',
  styleUrls: ['./create-entretien-dialog.component.css']
})
export class CreateEntretienDialogComponent implements OnInit {
  entretienForm: FormGroup;
  zegoLink: string = '';
  selectedDate: string = '';  // 'YYYY-MM-DD'
  selectedTime: string = '';  // 'HH:mm'
  
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, interactionPlugin],
    initialView: 'dayGridMonth',
    dateClick: this.onDateClick.bind(this),  // only date click, no time selection here
    selectable: false,
      height: 'auto',         // Let it size naturally
  contentHeight: 400,     // Or fixed pixel height to avoid extra space below
  aspectRatio: 1.35,      // Adjust width/height ratio if needed
  // Remove extra padding around header
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: ''
  },
  };
  

  existingInterviews: { dateEntretien: string }[] = [];

  constructor(
    public dialogRef: MatDialogRef<CreateEntretienDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { candidatureId: number },
    private fb: FormBuilder,
    private entretienService: EntretienService,
    private candidatureService: CandidatureService) {
    this.entretienForm = this.fb.group({
      dateEntretien: ['', Validators.required],
      commentaireRH: [''], // optional
      resultat: ['EN_ATTENTE', Validators.required],
      lien: ['']

    });
  }

   ngOnInit(): void {
    this.generateZegoLink();
     this.entretienService.getAllInterviews().subscribe({
    next: (entretiens: Entretien[]) => {
      console.log('Raw entretiens:', entretiens);
  
      const events = entretiens.map(entretien => {
        // const candidatureId = entretien.candidature?.id;

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
  
      console.log('Mapped events:', events); 
  
      this.calendarOptions = {
        ...this.calendarOptions,
        events: events,
      };
    },
    error: (err) => console.error('Error loading entretiens:', err)
  });
  
    }

      handleDateClick(arg: any) {
    // When user clicks a date on calendar, set the dateEntretien form control
    this.entretienForm.patchValue({ dateEntretien: arg.dateStr });
  }


  onDateClick(arg: { dateStr: string; }) {
  this.selectedDate = arg.dateStr;  // e.g. '2025-07-28'
  this.updateDateTime();
}

onTimeChange(event: any) {
  this.selectedTime = event.target.value; // e.g. '14:30'
  this.updateDateTime();
}

updateDateTime() {
  if (this.selectedDate && this.selectedTime) {
    // combine date + time, ISO format: "YYYY-MM-DDTHH:mm"
    const combined = `${this.selectedDate}T${this.selectedTime}`;
    this.entretienForm.patchValue({ dateEntretien: combined });
  }
}

  initCalendar() {
    // Prepare events from existing interviews to disable their dates
    const events = this.existingInterviews.map(e => ({
      title: 'Occupé',
      start: e.dateEntretien,
      allDay: true,
      display: 'background',
      color: '#ff9f89'
    }));

    this.calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      selectable: true,
      selectMirror: true,
      events: events,
      select: this.handleDateSelect.bind(this),
      validRange: {
        start: new Date().toISOString().slice(0, 10) // prevent past dates
      },
      selectOverlap: (event) => false, // disallow selecting already booked date
      dayMaxEvents: true,
      height: 400,
      eventDidMount: (info) => {
        // Mark occupied days visibly disabled
        info.el.style.backgroundColor = '#ff9f89';
        info.el.style.opacity = '0.5';
        info.el.style.pointerEvents = 'none';
      }
    };
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    const selectedDate = selectInfo.startStr;
    this.entretienForm.patchValue({ dateEntretien: selectedDate });
  }

onSubmit() {
  if (this.entretienForm.valid) {
    const entretienPayload = {
      ...this.entretienForm.value,
      candidatureId: this.data.candidatureId
    };

    console.log('Payload sent:', entretienPayload);

    this.entretienService.createEntretien(this.data.candidatureId, entretienPayload).subscribe({
      next: (createdEntretien) => {
        // Fetch full candidature first
        this.candidatureService.getCandidatureById(this.data.candidatureId).subscribe({
          next: (fullCandidature) => {
            // Update necessary fields
            const updatedCandidature = {
              ...fullCandidature,
              statutEntretien: "ENVOYE" as "ENVOYE" | "AUCUN" | "TERMINE" | undefined,
              entretienId: createdEntretien.id,
              entretienEnvoyeLe: new Date()
            };

            this.candidatureService.updateCandidature(this.data.candidatureId, updatedCandidature).subscribe({
              next: () => this.dialogRef.close(true),
              error: err => console.error('Error updating candidature:', err)
            });
          },
          error: err => console.error('Error fetching candidature:', err)
        });
      },
      error: err => console.error('Error creating entretien:', err)
    });
  }
}


  onCancel(): void {
    this.dialogRef.close(false);
  }

generateZegoLink() {
  const roomID = randomID(5);

  const appID = 591667673;
  const serverSecret = "43f6a8d22a15d8a6465dd4c1ad7a53a7";

  const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
    appID,
    serverSecret,
    roomID,
    randomID(5),
    randomID(5)
  );
  const baseURL = 'https://jobportal.com/meeting'; 
  this.zegoLink = `${baseURL}?roomID=${roomID}`;

  this.entretienForm.patchValue({
    lien: this.zegoLink
  });
}

}
