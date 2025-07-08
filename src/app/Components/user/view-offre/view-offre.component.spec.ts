import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOffreComponent } from './view-offre.component';

describe('ViewOffreComponent', () => {
  let component: ViewOffreComponent;
  let fixture: ComponentFixture<ViewOffreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewOffreComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewOffreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
