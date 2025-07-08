import { AfterViewInit, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OffreEmploiService } from 'src/app/Services/fn/offreemploi/OffreEmploiService';

@Component({
  selector: 'app-maincontent',
  templateUrl: './maincontent.component.html',
  styleUrls: ['./maincontent.component.css']
})
export class MaincontentComponent implements OnInit, AfterViewInit{

  offresEmploi: any[] = []; 

constructor(public jobService: OffreEmploiService, private route: ActivatedRoute){}
  ngOnInit(): void {
    this.loadJobOffers();
  }

  
  ngAfterViewInit() {
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        const element = document.getElementById(fragment);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }
  
  loadJobOffers() {
    this.jobService.getAllOffres().subscribe(
      (data) => {
        // Filter out archived offers (assuming each offer has an "archive" property which is truthy when archived)
        this.offresEmploi = data.filter(offre => !offre.archive).reverse();
        console.log(this.offresEmploi);
      },
      (error) => {
        console.error('Error loading job offers', error);
      }
    );
  }
  scrollLeft() {
    const jobList = document.querySelector('.job-list') as HTMLElement;
    jobList.scrollLeft -= 300; // Scrolls 300px to the left (adjust as needed)
  }
  
  scrollRight() {
    const jobList = document.querySelector('.job-list') as HTMLElement;
    jobList.scrollLeft += 300; // Scrolls 300px to the right (adjust as needed)
  }
}
