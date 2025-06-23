import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Actividad {
  id: string;
  nombre: string;
  tiempoOptimista: number;
  tiempoMasProbable: number;
  tiempoPesimista: number;
  tiempoEsperado: number;
  varianza: number;
  desviacionEstandar: number;
  predecesoras: string[];
  inicioTemprano: number;
  finTemprano: number;
  inicioTardio: number;
  finTardio: number;
  holguraTotal: number;
  holguraLibre: number;
  esCritica: boolean;
}

interface ResultadosPERT {
  duracionProyecto: number;
  varianzaProyecto: number;
  desviacionEstandarProyecto: number;
  rutaCritica: string[];
  probabilidades: {
    tiempoObjetivo: number;
    probabilidad: number;
  }[];
}

@Component({
  selector: 'app-component-pert',
  imports: [CommonModule, FormsModule],
  templateUrl: './component-pert.html',
  styleUrl: './component-pert.scss'
})
export class ComponentPert implements OnInit {
  actividades: Actividad[] = [];
  resultados: ResultadosPERT | null = null;
  nuevaActividad: Partial<Actividad> = {};
  tiempoObjetivo: number = 0;
  mostrarFormulario: boolean = false;
  errorMensaje: string = '';

  ngOnInit() {
    this.inicializarEjemplo();
  }

  inicializarEjemplo() {
    this.actividades = [
      {
        id: 'A',
        nombre: 'Análisis de Requisitos',
        tiempoOptimista: 2,
        tiempoMasProbable: 4,
        tiempoPesimista: 6,
        tiempoEsperado: 0,
        varianza: 0,
        desviacionEstandar: 0,
        predecesoras: [],
        inicioTemprano: 0,
        finTemprano: 0,
        inicioTardio: 0,
        finTardio: 0,
        holguraTotal: 0,
        holguraLibre: 0,
        esCritica: false
      },
      {
        id: 'B',
        nombre: 'Diseño del Sistema',
        tiempoOptimista: 3,
        tiempoMasProbable: 5,
        tiempoPesimista: 7,
        tiempoEsperado: 0,
        varianza: 0,
        desviacionEstandar: 0,
        predecesoras: ['A'],
        inicioTemprano: 0,
        finTemprano: 0,
        inicioTardio: 0,
        finTardio: 0,
        holguraTotal: 0,
        holguraLibre: 0,
        esCritica: false
      },
      {
        id: 'C',
        nombre: 'Implementación',
        tiempoOptimista: 8,
        tiempoMasProbable: 12,
        tiempoPesimista: 16,
        tiempoEsperado: 0,
        varianza: 0,
        desviacionEstandar: 0,
        predecesoras: ['B'],
        inicioTemprano: 0,
        finTemprano: 0,
        inicioTardio: 0,
        finTardio: 0,
        holguraTotal: 0,
        holguraLibre: 0,
        esCritica: false
      },
      {
        id: 'D',
        nombre: 'Pruebas',
        tiempoOptimista: 2,
        tiempoMasProbable: 3,
        tiempoPesimista: 4,
        tiempoEsperado: 0,
        varianza: 0,
        desviacionEstandar: 0,
        predecesoras: ['C'],
        inicioTemprano: 0,
        finTemprano: 0,
        inicioTardio: 0,
        finTardio: 0,
        holguraTotal: 0,
        holguraLibre: 0,
        esCritica: false
      }
    ];
    this.calcularPERT();
  }

  procesarYAgregarActividad(predecesoras: string) {
    this.nuevaActividad.predecesoras = predecesoras
      .split(',')
      .map(p => p.trim())
      .filter(p => p);
    this.agregarActividad();
  }

  agregarActividad() {
    // Limpiar mensaje de error anterior
    this.errorMensaje = '';

    if (!this.nuevaActividad.id || !this.nuevaActividad.nombre || 
        !this.nuevaActividad.tiempoOptimista || !this.nuevaActividad.tiempoMasProbable || 
        !this.nuevaActividad.tiempoPesimista) {
      this.errorMensaje = 'Todos los campos son obligatorios';
      return;
    }

    // Validar que los tiempos sean positivos
    if (this.nuevaActividad.tiempoOptimista <= 0 || 
        this.nuevaActividad.tiempoMasProbable <= 0 || 
        this.nuevaActividad.tiempoPesimista <= 0) {
      this.errorMensaje = 'Todos los tiempos deben ser mayores a 0';
      return;
    }

    // Validar que el tiempo optimista <= tiempo más probable <= tiempo pesimista
    if (this.nuevaActividad.tiempoOptimista > this.nuevaActividad.tiempoMasProbable ||
        this.nuevaActividad.tiempoMasProbable > this.nuevaActividad.tiempoPesimista) {
      this.errorMensaje = 'Los tiempos deben cumplir: Optimista ≤ Más Probable ≤ Pesimista';
      return;
    }

    if (this.actividades.some(a => a.id === this.nuevaActividad.id)) {
      this.errorMensaje = 'Ya existe una actividad con este ID';
      return;
    }

    // Validar que las predecesoras existan
    if (this.nuevaActividad.predecesoras && this.nuevaActividad.predecesoras.length > 0) {
      const predecesrasInvalidas = this.nuevaActividad.predecesoras.filter(p => 
        !this.actividades.some(a => a.id === p)
      );
      
      if (predecesrasInvalidas.length > 0) {
        this.errorMensaje = `Las siguientes predecesoras no existen: ${predecesrasInvalidas.join(', ')}`;
        return;
      }
    }

    const actividad: Actividad = {
      id: this.nuevaActividad.id!,
      nombre: this.nuevaActividad.nombre!,
      tiempoOptimista: this.nuevaActividad.tiempoOptimista!,
      tiempoMasProbable: this.nuevaActividad.tiempoMasProbable!,
      tiempoPesimista: this.nuevaActividad.tiempoPesimista!,
      tiempoEsperado: 0,
      varianza: 0,
      desviacionEstandar: 0,
      predecesoras: this.nuevaActividad.predecesoras || [],
      inicioTemprano: 0,
      finTemprano: 0,
      inicioTardio: 0,
      finTardio: 0,
      holguraTotal: 0,
      holguraLibre: 0,
      esCritica: false
    };

    this.actividades.push(actividad);
    this.nuevaActividad = {};
    this.mostrarFormulario = false;
    this.calcularPERT();
  }

  eliminarActividad(id: string) {
    this.actividades = this.actividades.filter(a => a.id !== id);
    // Eliminar referencias en predecesoras
    this.actividades.forEach(actividad => {
      actividad.predecesoras = actividad.predecesoras.filter(p => p !== id);
    });
    this.calcularPERT();
  }

  calcularPERT() {
    if (this.actividades.length === 0) {
      this.resultados = null;
      return;
    }

    // Validar que no haya dependencias circulares
    if (!this.validarDependencias()) {
      this.errorMensaje = 'Error: Se detectaron dependencias circulares en las actividades';
      return;
    }

    try {
      // Paso 1: Calcular tiempo esperado y varianza para cada actividad
      this.actividades.forEach(actividad => {
        actividad.tiempoEsperado = (actividad.tiempoOptimista + 4 * actividad.tiempoMasProbable + actividad.tiempoPesimista) / 6;
        actividad.varianza = Math.pow((actividad.tiempoPesimista - actividad.tiempoOptimista) / 6, 2);
        actividad.desviacionEstandar = Math.sqrt(actividad.varianza);
      });

      // Paso 2: Calcular tiempos tempranos (Forward Pass)
      this.calcularTiemposTempranos();

      // Paso 3: Calcular tiempos tardíos (Backward Pass)
      this.calcularTiemposTardios();

      // Paso 4: Calcular holguras y determinar ruta crítica
      this.calcularHolguras();

      // Paso 5: Generar resultados
      this.generarResultados();

    } catch (error) {
      console.error('Error en cálculos PERT:', error);
      this.errorMensaje = 'Error en los cálculos. Verifique las dependencias de las actividades.';
    }
  }

  private validarDependencias(): boolean {
    const visitado = new Set<string>();
    const enProceso = new Set<string>();

    const tieneCicloDFS = (actividadId: string): boolean => {
      if (enProceso.has(actividadId)) return true;
      if (visitado.has(actividadId)) return false;

      visitado.add(actividadId);
      enProceso.add(actividadId);

      const actividad = this.actividades.find(a => a.id === actividadId);
      if (actividad) {
        for (const predecesoraId of actividad.predecesoras) {
          if (tieneCicloDFS(predecesoraId)) return true;
        }
      }

      enProceso.delete(actividadId);
      return false;
    };

    for (const actividad of this.actividades) {
      if (tieneCicloDFS(actividad.id)) return false;
    }
    return true;
  }

  private calcularTiemposTempranos(): void {
    const procesadas = new Set<string>();
    let iteraciones = 0;
    const maxIteraciones = this.actividades.length * 2;

    // Inicializar actividades sin predecesoras
    this.actividades
      .filter(a => a.predecesoras.length === 0)
      .forEach(actividad => {
        actividad.inicioTemprano = 0;
        actividad.finTemprano = actividad.tiempoEsperado;
        procesadas.add(actividad.id);
      });

    while (procesadas.size < this.actividades.length) {
      iteraciones++;
      if (iteraciones > maxIteraciones) {
        throw new Error('Bucle infinito detectado en cálculo de tiempos tempranos');
      }

      const siguientes = this.actividades.filter(a => 
        !procesadas.has(a.id) && 
        a.predecesoras.length > 0 &&
        a.predecesoras.every(p => procesadas.has(p))
      );

      if (siguientes.length === 0) break;

      siguientes.forEach(actividad => {
        const tiemposFinPredecesoras = actividad.predecesoras
          .map(p => this.actividades.find(a => a.id === p))
          .filter(a => a !== undefined)
          .map(a => a!.finTemprano);
        
        if (tiemposFinPredecesoras.length > 0) {
          actividad.inicioTemprano = Math.max(...tiemposFinPredecesoras);
        } else {
          actividad.inicioTemprano = 0;
        }
        
        actividad.finTemprano = actividad.inicioTemprano + actividad.tiempoEsperado;
        procesadas.add(actividad.id);
      });
    }
  }

  private calcularTiemposTardios(): void {
    const duracionProyecto = Math.max(...this.actividades.map(a => a.finTemprano));
    
    // Encontrar actividades finales
    const finales = this.actividades.filter(a => 
      !this.actividades.some(b => b.predecesoras.includes(a.id))
    );
    
    // Inicializar actividades finales
    finales.forEach(actividad => {
      actividad.finTardio = duracionProyecto;
      actividad.inicioTardio = actividad.finTardio - actividad.tiempoEsperado;
    });

    const procesadas = new Set(finales.map(a => a.id));
    let iteraciones = 0;
    const maxIteraciones = this.actividades.length * 2;

    while (procesadas.size < this.actividades.length) {
      iteraciones++;
      if (iteraciones > maxIteraciones) {
        throw new Error('Bucle infinito detectado en cálculo de tiempos tardíos');
      }

      const anteriores = this.actividades.filter(a => 
        !procesadas.has(a.id) && 
        this.actividades.some(b => 
          b.predecesoras.includes(a.id) && procesadas.has(b.id)
        )
      );

      if (anteriores.length === 0) break;

      anteriores.forEach(actividad => {
        const sucesores = this.actividades.filter(b => 
          b.predecesoras.includes(actividad.id) && procesadas.has(b.id)
        );
        
        if (sucesores.length > 0) {
          const tiemposInicioSucesores = sucesores.map(s => s.inicioTardio);
          actividad.finTardio = Math.min(...tiemposInicioSucesores);
          actividad.inicioTardio = actividad.finTardio - actividad.tiempoEsperado;
          procesadas.add(actividad.id);
        }
      });
    }
  }

  private calcularHolguras(): void {
    this.actividades.forEach(actividad => {
      actividad.holguraTotal = actividad.inicioTardio - actividad.inicioTemprano;
      actividad.esCritica = Math.abs(actividad.holguraTotal) < 0.001;
      
      // Calcular holgura libre
      const sucesores = this.actividades.filter(b => b.predecesoras.includes(actividad.id));
      if (sucesores.length === 0) {
        actividad.holguraLibre = actividad.holguraTotal;
      } else {
        const minInicioSucesores = Math.min(...sucesores.map(s => s.inicioTemprano));
        actividad.holguraLibre = minInicioSucesores - actividad.finTemprano;
      }
    });
  }

  private generarResultados(): void {
    const duracionProyecto = Math.max(...this.actividades.map(a => a.finTemprano));
    const rutaCritica = this.actividades.filter(a => a.esCritica).map(a => a.id);
    
    const varianzaProyecto = this.actividades
      .filter(a => a.esCritica)
      .reduce((sum, a) => sum + a.varianza, 0);

    const desviacionEstandarProyecto = Math.sqrt(varianzaProyecto);

    // Calcular probabilidades
    const probabilidades = [];
    const rangoInferior = Math.max(1, Math.ceil(duracionProyecto - 3 * desviacionEstandarProyecto));
    const rangoSuperior = Math.ceil(duracionProyecto + 3 * desviacionEstandarProyecto);
    
    for (let t = rangoInferior; t <= rangoSuperior; t++) {
      const z = desviacionEstandarProyecto > 0 ? (t - duracionProyecto) / desviacionEstandarProyecto : 0;
      const probabilidad = this.calcularProbabilidadNormal(z);
      probabilidades.push({ tiempoObjetivo: t, probabilidad });
    }

    this.resultados = {
      duracionProyecto,
      varianzaProyecto,
      desviacionEstandarProyecto,
      rutaCritica,
      probabilidades
    };
  }

  calcularProbabilidadNormal(z: number): number {
    // Aproximación de la función de distribución acumulativa normal estándar
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2.0);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    return 0.5 * (1.0 + sign * y);
  }

  calcularProbabilidadTiempoObjetivo(): number {
    if (!this.resultados || this.tiempoObjetivo <= 0) return 0;
    
    const z = (this.tiempoObjetivo - this.resultados.duracionProyecto) / this.resultados.desviacionEstandarProyecto;
    return this.calcularProbabilidadNormal(z);
  }

  limpiarDatos() {
    this.actividades = [];
    this.resultados = null;
    this.nuevaActividad = {};
  }

  toggleFormulario() {
    this.mostrarFormulario = !this.mostrarFormulario;
    this.errorMensaje = '';
    this.nuevaActividad = {};
  }
}