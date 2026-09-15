export type ToolType = 'pen' | 'highlighter' | 'eraser' | 'pan';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  id: string;
  tool: ToolType;
  color: string;
  size: number;
  opacity: number;
  points: Point[];
}

export type GridType = 'blank' | 'grid' | 'dots' | 'lines';
export type BackgroundColor = 'white' | 'cream' | 'dark' | 'black';

export interface CanvasPage {
  id: string;
  strokes: Stroke[];
  undoStack: Stroke[][];
  redoStack: Stroke[][];
}
