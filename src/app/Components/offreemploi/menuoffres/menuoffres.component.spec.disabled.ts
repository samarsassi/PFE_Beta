import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuOffresComponent } from './menuoffres.component';

describe('MenuOffresComponent', () => {
  let component: MenuOffresComponent;
  let fixture: ComponentFixture<MenuOffresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MenuOffresComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MenuOffresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
