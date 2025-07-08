import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewOffreDialogComponent } from './view-offre-dialog.component';

describe('ViewOffreDialogComponent', () => {
  let component: ViewOffreDialogComponent;
  let fixture: ComponentFixture<ViewOffreDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewOffreDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewOffreDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
