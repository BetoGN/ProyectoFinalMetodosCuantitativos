import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Edge {
  from: number;
  to: number;
}

interface Step {
  description: string;
  residualGraph: number[][];
  path: Edge[];
  flow: number;
  maxFlow: number;
  isComplete?: boolean;
}

interface NodePosition {
  x: number;
  y: number;
}

interface DragState {
  isDragging: boolean;
  dragNodeIndex: number;
  dragOffset: { x: number; y: number };
}

interface LegendDragState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  position: { x: number; y: number };
}

@Component({
  selector: 'app-flujo-maximo',
  imports: [CommonModule],
  templateUrl: './flujo-maximo.html',
  styleUrls: ['./flujo-maximo.scss']
})
export class FlujoMaximoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('graphCanvas', { static: false }) graphCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('graphContainer', { static: false }) graphContainer!: ElementRef<HTMLDivElement>;

  nodeCount = 6;
  graph: number[][] = [];
  residualGraph: number[][] = [];
  steps: Step[] = [];
  currentStep = 0;
  autoPlayInterval: any;
  nodePositions: NodePosition[] = [];
  isMatrixVisible = true;
  isSolutionVisible = false;
  isAutoPlaying = false;
  maxFlowResult = 0;
  showCompletionHighlight = false;

  // Canvas context
  private ctx!: CanvasRenderingContext2D;
  private canvasInitialized = false;

  // Drag functionality for nodes
  private dragState: DragState = {
    isDragging: false,
    dragNodeIndex: -1,
    dragOffset: { x: 0, y: 0 }
  };

  // Drag functionality for legend
  private legendDragState: LegendDragState = {
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    position: { x: 0, y: 0 }
  };

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.setupGraph();
  }

  ngAfterViewInit() {
    // Canvas initialization will be handled when solution is shown
  }

  ngOnDestroy() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
    }
    this.removeEventListeners();
  }

  setupGraph() {
    this.isMatrixVisible = true;
    this.isSolutionVisible = false;
    this.canvasInitialized = false;
    this.maxFlowResult = 0;
    this.showCompletionHighlight = false;
    this.graph = Array(this.nodeCount).fill(null).map(() => Array(this.nodeCount).fill(0));
    this.cdr.detectChanges();
  }

  generateRandomMatrix() {
    console.log('Generating random matrix...');
    this.graph = Array(this.nodeCount).fill(null).map(() => Array(this.nodeCount).fill(0));
    
    // Create a more structured random graph to avoid edge crossings
    const density = 0.4; // 40% chance of having an edge
    
    for (let i = 0; i < this.nodeCount; i++) {
      for (let j = i + 1; j < this.nodeCount; j++) {
        if (Math.random() < density) {
          // Randomly decide direction
          if (Math.random() < 0.7) {
            // Forward edge (more likely)
            this.graph[i][j] = Math.floor(Math.random() * 20) + 5;
          } else {
            // Backward edge (less likely)
            this.graph[j][i] = Math.floor(Math.random() * 20) + 5;
          }
        }
      }
    }
    
    // Ensure source has outgoing edges
    if (this.sumRow(0) === 0) {
      const target = Math.floor(Math.random() * (this.nodeCount - 1)) + 1;
      this.graph[0][target] = Math.floor(Math.random() * 15) + 10;
    }
    
    // Ensure sink has incoming edges
    if (this.sumColumn(this.nodeCount - 1) === 0) {
      const source = Math.floor(Math.random() * (this.nodeCount - 1));
      this.graph[source][this.nodeCount - 1] = Math.floor(Math.random() * 15) + 10;
    }
    
    console.log('Random matrix generated:', this.graph);
    this.cdr.detectChanges();
  }

  private sumRow(row: number): number {
    return this.graph[row].reduce((sum, val) => sum + val, 0);
  }

  private sumColumn(col: number): number {
    return this.graph.reduce((sum, row) => sum + row[col], 0);
  }

  clearMatrix() {
    console.log('Clearing matrix...');
    this.graph = Array(this.nodeCount).fill(null).map(() => Array(this.nodeCount).fill(0));
    console.log('Matrix cleared:', this.graph);
    this.cdr.detectChanges();
  }

  loadExample() {
    console.log('Loading example...');
    this.nodeCount = 6;
    this.graph = [
      [0, 16, 13, 0, 0, 0],
      [0, 0, 10, 12, 0, 0],
      [0, 4, 0, 0, 14, 0],
      [0, 0, 9, 0, 0, 20],
      [0, 0, 0, 7, 0, 4],
      [0, 0, 0, 0, 0, 0]
    ];
    console.log('Example loaded:', this.graph);
    this.cdr.detectChanges();
  }

  loadExample2() {
    console.log('Loading example 2...');
    this.nodeCount = 5;
    this.graph = [
      [0, 10, 8, 0, 0],
      [0, 0, 5, 15, 0],
      [0, 0, 0, 0, 10],
      [0, 0, 6, 0, 12],
      [0, 0, 0, 0, 0]
    ];
    console.log('Example 2 loaded:', this.graph);
    this.cdr.detectChanges();
  }

  solveProblem() {
    console.log('Starting to solve problem...');
    console.log('Current graph:', this.graph);
    
    // Validate that we have a valid graph
    let hasEdges = false;
    for (let i = 0; i < this.nodeCount && !hasEdges; i++) {
      for (let j = 0; j < this.nodeCount && !hasEdges; j++) {
        if (this.graph[i][j] > 0) {
          hasEdges = true;
        }
      }
    }
    
    if (!hasEdges) {
      alert('Por favor, ingresa al menos una arista con capacidad mayor a 0.');
      return;
    }

    // Initialize residual graph
    this.residualGraph = this.graph.map(row => [...row]);
    this.steps = [];
    
    const source = 0;
    const sink = this.nodeCount - 1;
    let maxFlow = 0;

    console.log('Source:', source, 'Sink:', sink);

    // Initial step
    this.steps.push({
      description: "Algoritmo inicializado. Comenzando con el grafo original.",
      residualGraph: this.cloneMatrix(this.residualGraph),
      path: [],
      flow: 0,
      maxFlow: 0
    });

    // Ford-Fulkerson algorithm with BFS (Edmonds-Karp)
    let iterationCount = 0;
    const maxIterations = 100; // Prevent infinite loops
    
    while (iterationCount < maxIterations) {
      iterationCount++;
      console.log(`Iteration ${iterationCount}`);
      
      const { hasPath, parent, pathFlow } = this.bfsAugmentingPath(source, sink);
      
      console.log('BFS result:', { hasPath, pathFlow });
      
      if (!hasPath) {
        console.log('No more augmenting paths found');
        break;
      }

      // Construct path
      const path: Edge[] = [];
      let current = sink;
      while (current !== source) {
        const prev = parent[current];
        path.unshift({ from: prev, to: current });
        current = prev;
      }

      console.log('Path found:', path);

      // Update residual graph
      current = sink;
      while (current !== source) {
        const prev = parent[current];
        this.residualGraph[prev][current] -= pathFlow;
        this.residualGraph[current][prev] += pathFlow;
        current = prev;
      }

      maxFlow += pathFlow;
      console.log('Current max flow:', maxFlow);

      // Add step
      this.steps.push({
        description: `Camino encontrado: ${path.map(e => `${e.from}→${e.to}`).join(' → ')} con flujo de: ${pathFlow}`,
        residualGraph: this.cloneMatrix(this.residualGraph),
        path: [...path],
        flow: pathFlow,
        maxFlow: maxFlow
      });
    }

    // Final step with completion flag
    this.steps.push({
      description: `Algoritmo completado. No se encontraron más caminos aumentantes.`,
      residualGraph: this.cloneMatrix(this.residualGraph),
      path: [],
      flow: 0,
      maxFlow: maxFlow,
      isComplete: true
    });

    this.maxFlowResult = maxFlow;
    console.log('Total steps:', this.steps.length);
    console.log('Final max flow:', maxFlow);

    this.isMatrixVisible = false;
    this.isSolutionVisible = true;
    this.currentStep = 0;
    this.showCompletionHighlight = false;
    this.cdr.detectChanges();
    
    // Wait for the DOM to update then initialize canvas
    setTimeout(() => {
      this.initializeCanvas();
    }, 100);
  }

  private initializeCanvas() {
    console.log('Initializing canvas...');
    
    if (!this.graphCanvas || !this.graphContainer) {
      console.log('Canvas or container not ready, retrying...');
      setTimeout(() => this.initializeCanvas(), 50);
      return;
    }

    try {
      const canvas = this.graphCanvas.nativeElement;
      this.ctx = canvas.getContext('2d')!;
      
      if (!this.ctx) {
        console.error('Could not get canvas context');
        return;
      }

      console.log('Canvas context obtained');
      this.resizeCanvas();
      this.calculateOptimalNodePositions();
      this.initializeLegendPosition();
      this.setupEventListeners();
      this.canvasInitialized = true;
      console.log('Canvas initialized, showing first step');
      this.showStep(0);
    } catch (error) {
      console.error('Error initializing canvas:', error);
    }
  }

  private initializeLegendPosition() {
    if (!this.graphCanvas) return;
    
    const canvas = this.graphCanvas.nativeElement;
    this.legendDragState.position = {
      x: canvas.width - 180,
      y: 20
    };
  }

  private setupEventListeners() {
    if (!this.graphCanvas) return;

    const canvas = this.graphCanvas.nativeElement;
    
    // Mouse events
    canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));

    // Touch events for mobile
    canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Change cursor when hovering over nodes
    canvas.style.cursor = 'default';
  }

  private removeEventListeners() {
    if (!this.graphCanvas) return;

    const canvas = this.graphCanvas.nativeElement;
    
    canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
    canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
    canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
    canvas.removeEventListener('mouseleave', this.onMouseUp.bind(this));
    canvas.removeEventListener('touchstart', this.onTouchStart.bind(this));
    canvas.removeEventListener('touchmove', this.onTouchMove.bind(this));
    canvas.removeEventListener('touchend', this.onTouchEnd.bind(this));
  }

  private getMousePos(event: MouseEvent): { x: number; y: number } {
    const canvas = this.graphCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private getTouchPos(event: TouchEvent): { x: number; y: number } {
    const canvas = this.graphCanvas.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0] || event.changedTouches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  private getNodeAtPosition(x: number, y: number): number {
    const nodeRadius = 25;
    
    for (let i = 0; i < this.nodePositions.length; i++) {
      const pos = this.nodePositions[i];
      if (!pos) continue;
      
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= nodeRadius) {
        return i;
      }
    }
    
    return -1;
  }

  private isPointInLegend(x: number, y: number): boolean {
    const legendWidth = 160;
    const legendHeight = 120;
    const legendX = this.legendDragState.position.x;
    const legendY = this.legendDragState.position.y;
    
    return x >= legendX && x <= legendX + legendWidth &&
           y >= legendY && y <= legendY + legendHeight;
  }

  private onMouseDown(event: MouseEvent) {
    if (!this.canvasInitialized || this.isAutoPlaying) return;

    const mousePos = this.getMousePos(event);
    
    // Check if clicking on legend first
    if (this.isPointInLegend(mousePos.x, mousePos.y)) {
      this.legendDragState.isDragging = true;
      this.legendDragState.dragOffset = {
        x: mousePos.x - this.legendDragState.position.x,
        y: mousePos.y - this.legendDragState.position.y
      };
      
      const canvas = this.graphCanvas.nativeElement;
      canvas.style.cursor = 'grabbing';
      event.preventDefault();
      return;
    }
    
    // Check for node dragging
    const nodeIndex = this.getNodeAtPosition(mousePos.x, mousePos.y);
    if (nodeIndex !== -1) {
      this.dragState.isDragging = true;
      this.dragState.dragNodeIndex = nodeIndex;
      this.dragState.dragOffset = {
        x: mousePos.x - this.nodePositions[nodeIndex].x,
        y: mousePos.y - this.nodePositions[nodeIndex].y
      };
      
      const canvas = this.graphCanvas.nativeElement;
      canvas.style.cursor = 'grabbing';
      
      event.preventDefault();
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (!this.canvasInitialized) return;

    const mousePos = this.getMousePos(event);
    
    if (this.legendDragState.isDragging) {
      // Update legend position
      this.legendDragState.position = {
        x: mousePos.x - this.legendDragState.dragOffset.x,
        y: mousePos.y - this.legendDragState.dragOffset.y
      };
      
      // Keep legend within canvas bounds
      const canvas = this.graphCanvas.nativeElement;
      const legendWidth = 160;
      const legendHeight = 120;
      
      this.legendDragState.position.x = Math.max(0, Math.min(canvas.width - legendWidth, this.legendDragState.position.x));
      this.legendDragState.position.y = Math.max(0, Math.min(canvas.height - legendHeight, this.legendDragState.position.y));
      
      // Redraw the graph
      this.drawGraph();
    } else if (this.dragState.isDragging) {
      // Update node position
      this.nodePositions[this.dragState.dragNodeIndex] = {
        x: mousePos.x - this.dragState.dragOffset.x,
        y: mousePos.y - this.dragState.dragOffset.y
      };
      
      // Redraw the graph
      this.drawGraph();
    } else {
      // Change cursor when hovering
      const canvas = this.graphCanvas.nativeElement;
      if (this.isPointInLegend(mousePos.x, mousePos.y)) {
        canvas.style.cursor = 'grab';
      } else {
        const nodeIndex = this.getNodeAtPosition(mousePos.x, mousePos.y);
        canvas.style.cursor = nodeIndex !== -1 ? 'grab' : 'default';
      }
    }
  }

  private onMouseUp(event: MouseEvent) {
    if (this.legendDragState.isDragging) {
      this.legendDragState.isDragging = false;
      const canvas = this.graphCanvas.nativeElement;
      canvas.style.cursor = 'default';
    }
    
    if (this.dragState.isDragging) {
      this.dragState.isDragging = false;
      this.dragState.dragNodeIndex = -1;
      
      const canvas = this.graphCanvas.nativeElement;
      canvas.style.cursor = 'default';
    }
  }

  // Touch event handlers
  private onTouchStart(event: TouchEvent) {
    if (!this.canvasInitialized || this.isAutoPlaying) return;

    const touchPos = this.getTouchPos(event);
    
    // Check legend first
    if (this.isPointInLegend(touchPos.x, touchPos.y)) {
      this.legendDragState.isDragging = true;
      this.legendDragState.dragOffset = {
        x: touchPos.x - this.legendDragState.position.x,
        y: touchPos.y - this.legendDragState.position.y
      };
      event.preventDefault();
      return;
    }
    
    // Check nodes
    const nodeIndex = this.getNodeAtPosition(touchPos.x, touchPos.y);
    if (nodeIndex !== -1) {
      this.dragState.isDragging = true;
      this.dragState.dragNodeIndex = nodeIndex;
      this.dragState.dragOffset = {
        x: touchPos.x - this.nodePositions[nodeIndex].x,
        y: touchPos.y - this.nodePositions[nodeIndex].y
      };
      
      event.preventDefault();
    }
  }

  private onTouchMove(event: TouchEvent) {
    if (!this.canvasInitialized) return;

    const touchPos = this.getTouchPos(event);
    
    if (this.legendDragState.isDragging) {
      // Update legend position
      this.legendDragState.position = {
        x: touchPos.x - this.legendDragState.dragOffset.x,
        y: touchPos.y - this.legendDragState.dragOffset.y
      };
      
      // Keep legend within canvas bounds
      const canvas = this.graphCanvas.nativeElement;
      const legendWidth = 160;
      const legendHeight = 120;
      
      this.legendDragState.position.x = Math.max(0, Math.min(canvas.width - legendWidth, this.legendDragState.position.x));
      this.legendDragState.position.y = Math.max(0, Math.min(canvas.height - legendHeight, this.legendDragState.position.y));
      
      // Redraw the graph
      this.drawGraph();
    } else if (this.dragState.isDragging) {
      // Update node position
      this.nodePositions[this.dragState.dragNodeIndex] = {
        x: touchPos.x - this.dragState.dragOffset.x,
        y: touchPos.y - this.dragState.dragOffset.y
      };
      
      // Redraw the graph
      this.drawGraph();
    }
    
    event.preventDefault();
  }

  private onTouchEnd(event: TouchEvent) {
    if (this.legendDragState.isDragging) {
      this.legendDragState.isDragging = false;
    }
    
    if (this.dragState.isDragging) {
      this.dragState.isDragging = false;
      this.dragState.dragNodeIndex = -1;
    }
  }

  private bfsAugmentingPath(source: number, sink: number): { hasPath: boolean, parent: number[], pathFlow: number } {
    const visited = new Array(this.nodeCount).fill(false);
    const parent = new Array(this.nodeCount).fill(-1);
    const queue: number[] = [source];
    visited[source] = true;

    while (queue.length > 0) {
      const u = queue.shift()!;

      for (let v = 0; v < this.nodeCount; v++) {
        if (!visited[v] && this.residualGraph[u][v] > 0) {
          visited[v] = true;
          parent[v] = u;
          queue.push(v);
          
          if (v === sink) {
            // Calculate bottleneck flow
            let pathFlow = Infinity;
            let current = sink;
            while (current !== source) {
              const prev = parent[current];
              pathFlow = Math.min(pathFlow, this.residualGraph[prev][current]);
              current = prev;
            }
            return { hasPath: true, parent, pathFlow };
          }
        }
      }
    }

    return { hasPath: false, parent, pathFlow: 0 };
  }

  private resizeCanvas() {
    if (!this.graphCanvas || !this.graphContainer) return;

    const container = this.graphContainer.nativeElement;
    const canvas = this.graphCanvas.nativeElement;
    
    // Get actual container size
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width || 800, 800);
    const height = Math.max(rect.height || 600, 600);
    
    // Set canvas size
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    console.log('Canvas resized to:', width, 'x', height);
  }

  private calculateOptimalNodePositions() {
    if (!this.graphCanvas) return;

    const canvas = this.graphCanvas.nativeElement;
    const width = canvas.width || 800;
    const height = canvas.height || 600;
    const margin = 100;

    this.nodePositions = [];

    if (this.nodeCount <= 2) {
      // Special case for 2 nodes
      this.nodePositions.push({ x: margin, y: height / 2 });
      if (this.nodeCount === 2) {
        this.nodePositions.push({ x: width - margin, y: height / 2 });
      }
    } else if (this.nodeCount <= 6) {
      // Layered approach for small graphs to minimize crossings
      const layers = this.calculateLayers();
      this.positionNodesByLayers(layers, width, height, margin);
    } else {
      // Circular arrangement for larger graphs
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;

      for (let i = 0; i < this.nodeCount; i++) {
        const angle = (2 * Math.PI * i) / this.nodeCount - Math.PI / 2;
        this.nodePositions.push({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      }
    }

    console.log('Node positions calculated:', this.nodePositions);
  }

  private calculateLayers(): number[][] {
    // Simple layering algorithm based on longest path from source
    const layers: number[][] = [];
    const visited = new Array(this.nodeCount).fill(false);
    const layer = new Array(this.nodeCount).fill(0);
    
    // BFS to assign layers
    const queue = [0]; // Start from source
    visited[0] = true;
    layer[0] = 0;
    
    while (queue.length > 0) {
      const u = queue.shift()!;
      
      for (let v = 0; v < this.nodeCount; v++) {
        if (this.graph[u][v] > 0 && !visited[v]) {
          visited[v] = true;
          layer[v] = layer[u] + 1;
          queue.push(v);
        }
      }
    }
    
    // Group nodes by layer
    const maxLayer = Math.max(...layer);
    for (let i = 0; i <= maxLayer; i++) {
      layers[i] = [];
    }
    
    for (let i = 0; i < this.nodeCount; i++) {
      layers[layer[i]].push(i);
    }
    
    return layers;
  }

  private positionNodesByLayers(layers: number[][], width: number, height: number, margin: number) {
    const layerWidth = (width - 2 * margin) / Math.max(1, layers.length - 1);
    
    layers.forEach((layerNodes, layerIndex) => {
      const x = margin + layerIndex * layerWidth;
      const nodeHeight = (height - 2 * margin) / Math.max(1, layerNodes.length - 1);
      
      layerNodes.forEach((nodeId, nodeIndex) => {
        let y;
        if (layerNodes.length === 1) {
          y = height / 2;
        } else {
          y = margin + nodeIndex * nodeHeight;
        }
        
        this.nodePositions[nodeId] = { x, y };
      });
    });

    // Ensure sink is on the right if it's not already positioned well
    const sinkId = this.nodeCount - 1;
    if (this.nodePositions[sinkId].x < width * 0.7) {
      this.nodePositions[sinkId].x = width - margin;
    }
  }

  showStep(step: number) {
    if (step < 0 || step >= this.steps.length) return;
    
    this.currentStep = step;
    console.log('Showing step:', step);
    
    // Show completion highlight if this is the last step
    if (step === this.steps.length - 1 && this.steps[step].isComplete) {
      this.triggerCompletionHighlight();
    } else {
      this.showCompletionHighlight = false;
    }
    
    if (this.canvasInitialized && this.ctx) {
      this.drawGraph();
    }
  }

  private triggerCompletionHighlight() {
    this.showCompletionHighlight = true;
    
    // Remove highlight after animation
    setTimeout(() => {
      this.showCompletionHighlight = false;
      this.cdr.detectChanges();
    }, 2000);
  }

  private drawGraph() {
    if (!this.ctx || !this.steps.length || !this.canvasInitialized) {
      console.log('Cannot draw graph - missing requirements');
      return;
    }

    const step = this.steps[this.currentStep];
    const canvas = this.graphCanvas.nativeElement;
    
    // Clear canvas with background
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set background color based on completion state
    if (step.isComplete && this.showCompletionHighlight) {
      this.ctx.fillStyle = '#e8f5e8';
    } else {
      this.ctx.fillStyle = '#f8f9fa';
    }
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw edges first (so they appear behind nodes)
    this.drawEdges(step);
    
    // Draw nodes on top
    this.drawNodes(step);
    
    // Draw legend
    this.drawLegend();
    
    console.log('Graph drawn successfully');
  }

  private drawLegend() {
    if (!this.ctx) return;

    const legendX = this.legendDragState.position.x;
    const legendY = this.legendDragState.position.y;
    const legendWidth = 160;
    const legendHeight = 120;
    
    // Legend background with shadow
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    this.ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    
    // Legend border
    this.ctx.strokeStyle = '#ddd';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
    
    // Legend content
    this.ctx.font = '12px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    
    const itemHeight = 20;
    let currentY = legendY + 20;
    
    // Source
    this.ctx.beginPath();
    this.ctx.arc(legendX + 12, currentY, 8, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#4caf50';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillText('Origen (Nodo 0)', legendX + 25, currentY);
    currentY += itemHeight;
    
    // Sink
    this.ctx.beginPath();
    this.ctx.arc(legendX + 12, currentY, 8, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#f44336';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillText(`Destino (Nodo ${this.nodeCount - 1})`, legendX + 25, currentY);
    currentY += itemHeight;
    
    // Intermediate
    this.ctx.beginPath();
    this.ctx.arc(legendX + 12, currentY, 8, 0, 2 * Math.PI);
    this.ctx.fillStyle = '#2196f3';
    this.ctx.fill();
    this.ctx.strokeStyle = '#333';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillText('Nodos Intermedios', legendX + 25, currentY);
    currentY += itemHeight;
    
    // Current path
    this.ctx.strokeStyle = '#ff5722';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(legendX + 8, currentY);
    this.ctx.lineTo(legendX + 16, currentY);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillText('Camino Actual', legendX + 25, currentY);
    currentY += itemHeight;
    
    // Drag hint
    this.ctx.font = '10px Arial';
    this.ctx.fillStyle = '#666';
    this.ctx.fillText('Los elementos son arrastrables', legendX + 5, legendY + legendHeight - 8);
  }

  private drawEdges(step: Step) {
    if (!this.ctx || this.nodePositions.length === 0) return;

    const nodeRadius = 25;
    
    for (let i = 0; i < this.nodeCount; i++) {
      for (let j = 0; j < this.nodeCount; j++) {
        if (this.graph[i][j] > 0) { // Only draw edges that exist in original graph
          const fromPos = this.nodePositions[i];
          const toPos = this.nodePositions[j];
          
          if (!fromPos || !toPos) continue;
          
          // Calculate edge positions (avoiding node overlap)
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          if (length === 0) continue; // Skip if nodes are at same position
          
          const unitX = dx / length;
          const unitY = dy / length;
          
          const startX = fromPos.x + unitX * nodeRadius;
          const startY = fromPos.y + unitY * nodeRadius;
          const endX = toPos.x - unitX * nodeRadius;
          const endY = toPos.y - unitY * nodeRadius;
          
          // Check if this edge is in current path
          const isPathEdge = step.path.some(edge => edge.from === i && edge.to === j);
          
          // Set edge style
          this.ctx.strokeStyle = isPathEdge ? '#ff5722' : '#666';
          this.ctx.lineWidth = isPathEdge ? 4 : 2;
          this.ctx.globalAlpha = step.residualGraph[i][j] === 0 ? 0.3 : 1.0;
          this.ctx.setLineDash(step.residualGraph[i][j] === 0 ? [5, 5] : []);
          
          // Draw edge
          this.ctx.beginPath();
          this.ctx.moveTo(startX, startY);
          this.ctx.lineTo(endX, endY);
          this.ctx.stroke();
          
          // Reset alpha and line dash for arrow and label
          this.ctx.globalAlpha = 1.0;
          this.ctx.setLineDash([]);
          
          // Draw arrow
          this.drawArrow(endX, endY, Math.atan2(dy, dx), isPathEdge);
          
          // Draw capacity label
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          this.drawEdgeLabel(midX, midY, step.residualGraph[i][j], this.graph[i][j], isPathEdge);
        }
      }
    }
  }

  private drawArrow(x: number, y: number, angle: number, isHighlighted: boolean) {
    if (!this.ctx) return;

    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;
    
    this.ctx.strokeStyle = isHighlighted ? '#ff5722' : '#666';
    this.ctx.lineWidth = isHighlighted ? 3 : 2;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - arrowLength * Math.cos(angle - arrowAngle),
      y - arrowLength * Math.sin(angle - arrowAngle)
    );
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(
      x - arrowLength * Math.cos(angle + arrowAngle),
      y - arrowLength * Math.sin(angle + arrowAngle)
    );
    this.ctx.stroke();
  }

  private drawEdgeLabel(x: number, y: number, current: number, original: number, isHighlighted: boolean) {
    if (!this.ctx) return;

    const text = `${current}/${original}`;
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // Background
    const metrics = this.ctx.measureText(text);
    const padding = 6;
    const bgWidth = metrics.width + 2 * padding;
    const bgHeight = 20;
    
    this.ctx.fillStyle = isHighlighted ? '#ffebee' : 'white';
    this.ctx.fillRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
    
    // Border
    this.ctx.strokeStyle = isHighlighted ? '#ff5722' : '#ddd';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x - bgWidth / 2, y - bgHeight / 2, bgWidth, bgHeight);
    
    // Text
    this.ctx.fillStyle = isHighlighted ? '#ff5722' : '#333';
    this.ctx.fillText(text, x, y);
  }

  private drawNodes(step: Step) {
    if (!this.ctx || this.nodePositions.length === 0) return;

    for (let i = 0; i < this.nodeCount; i++) {
      const pos = this.nodePositions[i];
      if (!pos) continue;

      const isInPath = step.path.some(edge => edge.from === i || edge.to === i);
      const isDragging = this.dragState.isDragging && this.dragState.dragNodeIndex === i;
      const nodeRadius = 25;
      
      // Node shadow
      if (isInPath || isDragging) {
        this.ctx.beginPath();
        this.ctx.arc(pos.x + 2, pos.y + 2, nodeRadius, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();
      }
      
      // Node circle
      this.ctx.beginPath();
      this.ctx.arc(pos.x, pos.y, nodeRadius, 0, 2 * Math.PI);
      
      // Node color based on type and state
      let fillColor;
      if (i === 0) {
        fillColor = isInPath ? '#2e7d32' : '#4caf50'; // Source - green
      } else if (i === this.nodeCount - 1) {
        fillColor = isInPath ? '#c62828' : '#f44336'; // Sink - red
      } else {
        fillColor = isInPath ? '#1565c0' : '#2196f3'; // Intermediate - blue
      }
      
      // Slightly brighten color if being dragged
      if (isDragging) {
        this.ctx.fillStyle = this.brightenColor(fillColor, 0.2);
      } else {
        this.ctx.fillStyle = fillColor;
      }
      
      this.ctx.fill();
      
      // Node border
      this.ctx.strokeStyle = (isInPath || isDragging) ? '#fff' : '#333';
      this.ctx.lineWidth = (isInPath || isDragging) ? 4 : 2;
      this.ctx.stroke();
      
      // Node label
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.strokeStyle = '#333';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText(i.toString(), pos.x, pos.y);
      this.ctx.fillText(i.toString(), pos.x, pos.y);
    }
  }

  private brightenColor(color: string, factor: number): string {
    // Simple color brightening function
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    
    const r = Math.min(255, Math.floor(data[0] * (1 + factor)));
    const g = Math.min(255, Math.floor(data[1] * (1 + factor)));
    const b = Math.min(255, Math.floor(data[2] * (1 + factor)));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  previousStep() {
    this.showStep(this.currentStep - 1);
  }

  nextStep() {
    this.showStep(this.currentStep + 1);
  }

  restartAnimation() {
    this.currentStep = 0;
    this.showStep(0);
  }

  toggleAutoPlay() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
      this.isAutoPlaying = false;
    } else {
      this.isAutoPlaying = true;
      this.autoPlayInterval = setInterval(() => {
        if (this.currentStep < this.steps.length - 1) {
          this.showStep(this.currentStep + 1);
        } else {
          // Stop auto-play when reaching the end
          this.toggleAutoPlay();
        }
      }, 2500);
    }
  }

  resetSolution() {
    if (this.autoPlayInterval) {
      clearInterval(this.autoPlayInterval);
      this.autoPlayInterval = null;
      this.isAutoPlaying = false;
    }
    this.isSolutionVisible = false;
    this.isMatrixVisible = true;
    this.steps = [];
    this.currentStep = 0;
    this.maxFlowResult = 0;
    this.showCompletionHighlight = false;
    this.canvasInitialized = false;
    this.dragState.isDragging = false;
    this.dragState.dragNodeIndex = -1;
    this.legendDragState.isDragging = false;
    this.cdr.detectChanges();
  }

  updateNodeCount() {
    this.setupGraph();
  }

  onNodeCountChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const newCount = parseInt(target.value) || 6;
    if (newCount !== this.nodeCount) {
      this.nodeCount = newCount;
      this.updateNodeCount();
    }
  }

  onMatrixInputChange(event: Event, i: number, j: number) {
    const target = event.target as HTMLInputElement;
    const numValue = parseInt(target.value) || 0;
    this.graph[i][j] = Math.max(0, numValue); // Ensure non-negative values
    console.log(`Matrix updated at [${i}][${j}] = ${this.graph[i][j]}`);
  }

  private cloneMatrix(matrix: number[][]): number[][] {
    return matrix.map(row => [...row]);
  }

  getMatrixValue(i: number, j: number): number {
    return this.graph[i][j] || 0;
  }

  range(n: number): number[] {
    return Array(n).fill(0).map((_, i) => i);
  }

  getCurrentStepInfo(): string {
    return `Paso ${this.currentStep + 1} de ${this.steps.length}`;
  }

  getCurrentStep(): Step | null {
    return this.steps[this.currentStep] || null;
  }

  isLastStep(): boolean {
    return this.currentStep === this.steps.length - 1;
  }
}