
import { Component, Inject,  } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Candidature } from 'src/app/Data/Candidature';

@Component({
  selector: 'app-on-delete-dialog',
  templateUrl: './on-delete-dialog.component.html',
})
export class OnDeleteDialogComponent {

constructor(@Inject(MAT_DIALOG_DATA) public data: Candidature){}
}
