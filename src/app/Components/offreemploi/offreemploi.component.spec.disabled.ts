import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OffreemploiComponent } from './offreemploi.component';

describe('OffreemploiComponent', () => {
  let component: OffreemploiComponent;
  let fixture: ComponentFixture<OffreemploiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OffreemploiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OffreemploiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
