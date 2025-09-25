import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CvAnalyzerComponent } from './cv-analyzer.component';

describe('CvAnalyzerComponent', () => {
  let component: CvAnalyzerComponent;
  let fixture: ComponentFixture<CvAnalyzerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CvAnalyzerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CvAnalyzerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
