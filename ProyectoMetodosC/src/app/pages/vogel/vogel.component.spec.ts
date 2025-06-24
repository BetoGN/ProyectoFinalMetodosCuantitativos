import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { VogelComponent } from './vogel.component';

describe('VogelComponent', () => {
  let component: VogelComponent;
  let fixture: ComponentFixture<VogelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VogelComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(VogelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debe generar matriz de costos con dimensiones correctas', () => {
    component.plantas = 2;
    component.ciudades = 3;
    component.actualizarPlantasCiudades();
    expect(component.costos.length).toBe(2);
    expect(component.costos[0].length).toBe(3);
  });

  it('debe calcular correctamente el costo total', () => {
    component.plantas = 2;
    component.ciudades = 2;
    component.costos = [
      [4, 1],
      [2, 3]
    ];
    component.oferta = [5, 5];
    component.demanda = [4, 6];
    component.calcularVogel();
    expect(component.costoTotal).toBeGreaterThan(0);
  });
});
