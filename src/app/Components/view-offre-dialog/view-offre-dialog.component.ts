import { AfterViewInit, Component, Inject, Input, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import * as L from 'leaflet';

@Component({
  selector: 'app-view-offre-dialog',
  templateUrl: './view-offre-dialog.component.html',
  styleUrls: ['./view-offre-dialog.component.css']
})
export class ViewOffreDialogComponent implements OnInit {
  map!: L.Map;
  lat!: number;
  lng!: number;
  constructor(
    public dialogRef: MatDialogRef<ViewOffreDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
    if (this.map) {
      this.map.remove();
    }
  }
  
 ngOnInit(): void {
  if (this.data.localisation) {
    console.log("Address found:", this.data.localisation);

    this.getCoordinates(this.data.localisation)
      .then(({ lat, lng }) => {
        this.lat = lat;
        this.lng = lng;
        console.log(`Coordinates for the address: ${lat}, ${lng}`);
        this.initMap();
      })
      .catch(error => {
        console.error("Error retrieving coordinates:", error);
      });
  }
}

initMap() {
  // Only initialize the map if it isn't already initialized
  if (!this.map) {
    this.map = L.map('map').setView([this.lat, this.lng], 13); // Default to the provided lat, lng

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const customIcon = L.icon({
      iconUrl: 'assets/img/custom-marker.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });

    const marker = L.marker([this.lat, this.lng], { icon: customIcon, draggable: false }).addTo(this.map);
    marker.on('dragend', (event: any) => {
      const latlng = event.target.getLatLng();
      console.log(`Selected Location: ${latlng.lat}, ${latlng.lng}`);
    });
  }
}


  async getCoordinates(address: string): Promise<{ lat: number, lng: number }> {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        return { lat, lng };
      } else {
        throw new Error("Coordinates not found");
      }
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      throw new Error("Failed to fetch coordinates");
    }
  }
}

