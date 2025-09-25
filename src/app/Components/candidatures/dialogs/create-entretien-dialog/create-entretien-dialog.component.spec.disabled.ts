import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEntretienDialogComponent } from './create-entretien-dialog.component';

describe('CreateEntretienDialogComponent', () => {
  let component: CreateEntretienDialogComponent;
  let fixture: ComponentFixture<CreateEntretienDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateEntretienDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEntretienDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
