// Archivo: vogel.component.ts

import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-vogel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vogel.component.html',
  styleUrls: ['./vogel.component.scss']
})
export class VogelComponent {
  plantas: number = 3;
  ciudades: number = 3;

  oferta: number[] = Array(this.plantas).fill(0);
  demanda: number[] = Array(this.ciudades).fill(0);
  costos: number[][] = [];
  resultadoTabla: number[][] = [];
  costoTotal: number = 0;

  constructor() {
    this.generarMatrizCostos();
  }

  generarMatrizCostos() {
    this.costos = Array(this.plantas).fill(0).map(() => Array(this.ciudades).fill(0));
    this.oferta = Array(this.plantas).fill(0);
    this.demanda = Array(this.ciudades).fill(0);
  }

  actualizarPlantasCiudades() {
    this.generarMatrizCostos();
  }

  calcularVogel() {
    const costosCopy = this.costos.map(row => [...row]);
    let ofertaCopy = [...this.oferta];
    let demandaCopy = [...this.demanda];

    const sumaOferta = ofertaCopy.reduce((a, b) => a + b, 0);
    const sumaDemanda = demandaCopy.reduce((a, b) => a + b, 0);

    if (sumaOferta > sumaDemanda) {
      const diff = sumaOferta - sumaDemanda;
      demandaCopy.push(diff);
      costosCopy.forEach(row => row.push(0));
    } else if (sumaDemanda > sumaOferta) {
      const diff = sumaDemanda - sumaOferta;
      ofertaCopy.push(diff);
      costosCopy.push(new Array(demandaCopy.length).fill(0));
    }

    const m = ofertaCopy.length;
    const n = demandaCopy.length;
    const asignaciones: { [key: string]: number } = {};
    const filasActivas = Array(m).fill(true);
    const columnasActivas = Array(n).fill(true);

    const calcularPenalizaciones = () => {
      const pf = Array(m).fill(0);
      const pc = Array(n).fill(0);

      for (let i = 0; i < m; i++) {
        if (filasActivas[i]) {
          const fila = [];
          for (let j = 0; j < n; j++) {
            if (columnasActivas[j]) fila.push(costosCopy[i][j]);
          }
          pf[i] = fila.length >= 2 ? fila.sort((a, b) => a - b)[1] - fila[0] : fila[0] ?? -1;
        } else pf[i] = -1;
      }

      for (let j = 0; j < n; j++) {
        if (columnasActivas[j]) {
          const col = [];
          for (let i = 0; i < m; i++) {
            if (filasActivas[i]) col.push(costosCopy[i][j]);
          }
          pc[j] = col.length >= 2 ? col.sort((a, b) => a - b)[1] - col[0] : col[0] ?? -1;
        } else pc[j] = -1;
      }

      return { pf, pc };
    };

    while (filasActivas.includes(true) && columnasActivas.includes(true)) {
      const { pf, pc } = calcularPenalizaciones();
      const maxPf = Math.max(...pf);
      const maxPc = Math.max(...pc);
      let i: number, j: number;

      if (maxPf >= maxPc) {
        i = pf.indexOf(maxPf);
        j = costosCopy[i].map((c, idx) => columnasActivas[idx] ? c : Infinity)
                         .indexOf(Math.min(...costosCopy[i].filter((_, idx) => columnasActivas[idx])));
      } else {
        j = pc.indexOf(maxPc);
        i = costosCopy.map((row, idx) => filasActivas[idx] ? row[j] : Infinity)
                      .indexOf(Math.min(...costosCopy.map((row, idx) => filasActivas[idx] ? row[j] : Infinity)));
      }

      const cantidad = Math.min(ofertaCopy[i], demandaCopy[j]);
      asignaciones[`${i},${j}`] = cantidad;
      ofertaCopy[i] -= cantidad;
      demandaCopy[j] -= cantidad;

      if (ofertaCopy[i] === 0) filasActivas[i] = false;
      if (demandaCopy[j] === 0) columnasActivas[j] = false;
    }

    this.resultadoTabla = Array(m).fill(0).map(() => Array(n).fill(0));
    for (const key in asignaciones) {
      const [i, j] = key.split(',').map(Number);
      this.resultadoTabla[i][j] = asignaciones[key];
    }

    this.costoTotal = Object.entries(asignaciones).reduce((total, [key, val]) => {
      const [i, j] = key.split(',').map(Number);
      return total + val * this.costos[i][j];
    }, 0);
  }
}
