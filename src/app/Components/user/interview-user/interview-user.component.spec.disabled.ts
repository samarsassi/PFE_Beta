import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InterviewUserComponent } from './interview-user.component';

describe('InterviewUserComponent', () => {
  let component: InterviewUserComponent;
  let fixture: ComponentFixture<InterviewUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InterviewUserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InterviewUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
