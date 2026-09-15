import type { FC } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Hand,
  FileText,
  BookOpen,
  Columns
} from 'lucide-react';
import type { ToolType, BackgroundColor, GridType } from '../types/drawing';

interface ToolbarProps {
  tool: ToolType;
  setTool: (tool: ToolType) => void;
  color: string;
  setColor: (color: string) => void;
  size: number;
  setSize: (size: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  backgroundColor?: BackgroundColor;
  setBackgroundColor?: (bg: BackgroundColor) => void;
  gridType?: GridType;
  setGridType?: (grid: GridType) => void;
  viewMode: 'pdf' | 'notes' | 'split';
  setViewMode: (mode: 'pdf' | 'notes' | 'split') => void;
}

const PALETTE_COLORS = [
  '#0f172a', // Negro carbón
  '#2563eb', // Azul
  '#dc2626', // Rojo
  '#16a34a', // Verde
  '#d97706', // Ámbar / Naranja
  '#9333ea', // Morado
  '#ec4899', // Rosa
  '#ffffff', // Blanco
];

const HIGHLIGHTER_COLORS = [
  '#fde047', // Amarillo
  '#86efac', // Verde claro
  '#93c5fd', // Celeste
  '#f472b6', // Rosa
  '#fdba74', // Naranja suave
];

export const Toolbar: FC<ToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  size,
  setSize,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  backgroundColor,
  setBackgroundColor,
  gridType,
  setGridType,
  viewMode,
  setViewMode,
}) => {
  return (
    <header className="h-14 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 flex items-center justify-between px-3 shrink-0 shadow-lg z-30 select-none">
      {/* Selector de modo de vista (PDF | Dividido | Libreta) */}
      <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
        <button
          title="Solo PDF"
          onClick={() => setViewMode('pdf')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'pdf'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <FileText size={15} />
          <span className="hidden md:inline">PDF</span>
        </button>

        <button
          title="Pantalla Dividida"
          onClick={() => setViewMode('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'split'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <Columns size={15} />
          <span className="hidden md:inline">Dividida</span>
        </button>

        <button
          title="Solo Libreta"
          onClick={() => setViewMode('notes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            viewMode === 'notes'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
          }`}
        >
          <BookOpen size={15} />
          <span className="hidden md:inline">Libreta</span>
        </button>
      </div>

      {/* Herramientas de Dibujo / Stylus */}
      <div className="flex items-center gap-1.5">
        {/* Lápiz */}
        <button
          title="Lápiz"
          onClick={() => setTool('pen')}
          className={`p-2 rounded-xl transition-all ${
            tool === 'pen'
              ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Pen size={18} />
        </button>

        {/* Resaltador */}
        <button
          title="Resaltador"
          onClick={() => setTool('highlighter')}
          className={`p-2 rounded-xl transition-all ${
            tool === 'highlighter'
              ? 'bg-yellow-500 text-slate-950 shadow-md ring-2 ring-yellow-400/50 font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Highlighter size={18} />
        </button>

        {/* Borrador */}
        <button
          title="Borrador de Trazos"
          onClick={() => setTool('eraser')}
          className={`p-2 rounded-xl transition-all ${
            tool === 'eraser'
              ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-400/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Eraser size={18} />
        </button>

        {/* Desplazar / Mano */}
        <button
          title="Mano / Desplazar"
          onClick={() => setTool('pan')}
          className={`p-2 rounded-xl transition-all ${
            tool === 'pan'
              ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Hand size={18} />
        </button>

        <div className="h-6 w-px bg-slate-700 mx-1" />

        {/* Paleta rápida de colores */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
          {(tool === 'highlighter' ? HIGHLIGHTER_COLORS : PALETTE_COLORS).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-6 h-6 rounded-full transition-transform border border-slate-700/60 ${
                color === c ? 'scale-125 ring-2 ring-blue-400 z-10' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Slider de Grosor */}
        <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
          <span className="text-slate-400">{size}px</span>
          <input
            type="range"
            min={1}
            max={tool === 'highlighter' ? 32 : 24}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-16 h-1.5 accent-blue-500 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Opciones de Libreta / Acciones (Undo, Redo, Fondo, Cuadrícula) */}
      <div className="flex items-center gap-1">
        {/* Personalización de libreta si aplica */}
        {setBackgroundColor && (
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
            <button
              title="Fondo Blanco"
              onClick={() => setBackgroundColor('white')}
              className={`w-5 h-5 rounded-md bg-white border border-slate-400 ${
                backgroundColor === 'white' ? 'ring-2 ring-blue-500' : ''
              }`}
            />
            <button
              title="Fondo Marfil / Crema"
              onClick={() => setBackgroundColor('cream')}
              className={`w-5 h-5 rounded-md bg-[#fdf6e2] border border-amber-300 ${
                backgroundColor === 'cream' ? 'ring-2 ring-blue-500' : ''
              }`}
            />
            <button
              title="Fondo Oscuro"
              onClick={() => setBackgroundColor('dark')}
              className={`w-5 h-5 rounded-md bg-[#1e293b] border border-slate-600 ${
                backgroundColor === 'dark' ? 'ring-2 ring-blue-500' : ''
              }`}
            />
            <button
              title="Fondo Negro"
              onClick={() => setBackgroundColor('black')}
              className={`w-5 h-5 rounded-md bg-[#0a0f1d] border border-slate-700 ${
                backgroundColor === 'black' ? 'ring-2 ring-blue-500' : ''
              }`}
            />
          </div>
        )}

        {setGridType && (
          <div className="flex items-center bg-slate-800 p-1 rounded-xl text-xs">
            <select
              value={gridType}
              onChange={(e) => setGridType(e.target.value as GridType)}
              className="bg-transparent text-slate-300 text-xs px-1.5 py-0.5 outline-none cursor-pointer"
            >
              <option value="blank" className="bg-slate-900">Liso</option>
              <option value="grid" className="bg-slate-900">Cuadrícula</option>
              <option value="dots" className="bg-slate-900">Puntos</option>
              <option value="lines" className="bg-slate-900">Rayas</option>
            </select>
          </div>
        )}

        <div className="h-6 w-px bg-slate-700 mx-1" />

        {/* Deshacer / Rehacer */}
        <button
          title="Deshacer"
          disabled={!canUndo}
          onClick={onUndo}
          className={`p-2 rounded-xl transition-all ${
            canUndo
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-850 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Undo2 size={17} />
        </button>

        <button
          title="Rehacer"
          disabled={!canRedo}
          onClick={onRedo}
          className={`p-2 rounded-xl transition-all ${
            canRedo
              ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              : 'bg-slate-850 text-slate-600 cursor-not-allowed'
          }`}
        >
          <Redo2 size={17} />
        </button>

        {/* Limpiar lienzo */}
        <button
          title="Limpiar Página"
          onClick={onClear}
          className="p-2 bg-slate-800 text-rose-400 hover:bg-rose-950/60 rounded-xl transition-all"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </header>
  );
};
