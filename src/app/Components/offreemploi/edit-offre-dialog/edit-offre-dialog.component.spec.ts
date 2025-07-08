import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditOffreDialogComponent } from './edit-offre-dialog.component';

describe('EditOffreDialogComponent', () => {
  let component: EditOffreDialogComponent;
  let fixture: ComponentFixture<EditOffreDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditOffreDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditOffreDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
