import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface LocationDialogData {
    message: string;
    title: string;
}

@Component({
    template: `
    <div class="dialog-container">
      <h1 class="dialog-title">{{ data.title }}</h1>
      <div class="dialog-message">{{ data.message }}</div>
      <div class="dialog-actions">
        <button class="cancel-button" (click)="onNoClick()">Annuler</button>
        <button class="ok-button" (click)="onYesClick()">Ok</button>
      </div>
    </div>
  `,
    styleUrls: ['./confirmation-dialog.component.css']
})
export class ConfirmLocationDialog {
    constructor(
        public dialogRef: MatDialogRef<ConfirmLocationDialog>,
        @Inject(MAT_DIALOG_DATA) public data: LocationDialogData
    ) { }

    onNoClick(): void {
        this.dialogRef.close(false);
    }

    onYesClick(): void {
        this.dialogRef.close(true);
    }
} 