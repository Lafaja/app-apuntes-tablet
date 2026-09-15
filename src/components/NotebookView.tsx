import { useState, useRef, useEffect, type FC } from 'react';
import { ChevronLeft, ChevronRight, Plus, Download } from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import type { ToolType, BackgroundColor, GridType, Stroke } from '../types/drawing';

interface NotebookViewProps {
  tool: ToolType;
  color: string;
  size: number;
  backgroundColor: BackgroundColor;
  gridType: GridType;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddPage: () => void;
}

export const NotebookView: FC<NotebookViewProps> = ({
  tool,
  color,
  size,
  backgroundColor,
  gridType,
  strokes,
  onStrokesChange,
  currentPage,
  totalPages,
  onPageChange,
  onAddPage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 1100,
  });

  // Ajustar dimensiones responsivas para pantalla de tablet
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        // Mantener proporción estándar de página A4 / tablet
        const targetWidth = Math.min(clientWidth - 32, 1000);
        const targetHeight = Math.max(clientHeight - 48, 1200);
        setDimensions({
          width: Math.max(targetWidth, 400),
          height: Math.max(targetHeight, 600),
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Clases y colores de fondo
  const bgStyles: Record<BackgroundColor, { bg: string; text: string; gridColor: string }> = {
    white: { bg: '#ffffff', text: '#0f172a', gridColor: '#e2e8f0' },
    cream: { bg: '#fbf7ee', text: '#292524', gridColor: '#e7dfd1' },
    dark: { bg: '#1e293b', text: '#f8fafc', gridColor: '#334155' },
    black: { bg: '#0b0f19', text: '#f1f5f9', gridColor: '#1e293b' },
  };

  const currentTheme = bgStyles[backgroundColor];

  // Exportar la página actual como imagen PNG
  const handleExportPNG = () => {
    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fondo
    ctx.scale(dpr, dpr);
    ctx.fillStyle = currentTheme.bg;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Dibujar trazos
    strokes.forEach((stroke) => {
      if (stroke.points.length < 1) return;
      ctx.save();
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity * 0.45;
        ctx.lineWidth = stroke.size * 2.8;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = stroke.size * 2.2;
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity;
        ctx.lineWidth = stroke.size;
      }

      const points = stroke.points;
      if (points.length === 1) {
        ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const xc = (points[i].x + points[i + 1].x) / 2;
          const yc = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
        }
        if (points.length > 1) {
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        }
        ctx.stroke();
      }
      ctx.restore();
    });

    const link = document.createElement('a');
    link.download = `nota-pagina-${currentPage}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Renderizar patrón SVG de fondo
  const renderPattern = () => {
    if (gridType === 'blank') return null;

    if (gridType === 'grid') {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" fill="none" stroke={currentTheme.gridColor} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      );
    }

    if (gridType === 'dots') {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-pattern" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill={currentTheme.gridColor} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>
      );
    }

    if (gridType === 'lines') {
      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lines-pattern" width="100%" height="32" patternUnits="userSpaceOnUse">
              <line x1="0" y1="31" x2="100%" y2="31" stroke={currentTheme.gridColor} strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines-pattern)" />
        </svg>
      );
    }

    return null;
  };

  return (
    <div ref={containerRef} className="flex-1 h-full bg-slate-950 flex flex-col items-center justify-between overflow-y-auto p-3 relative">
      {/* Hoja de libreta */}
      <div
        className="relative shadow-2xl rounded-lg transition-colors overflow-hidden shrink-0 border border-slate-700/50"
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          backgroundColor: currentTheme.bg,
        }}
      >
        {/* Patrón de cuadrícula / puntos / rayas */}
        {renderPattern()}

        {/* Lienzo de dibujo con Stylus */}
        <DrawingCanvas
          width={dimensions.width}
          height={dimensions.height}
          tool={tool}
          color={color}
          size={size}
          strokes={strokes}
          onStrokesChange={onStrokesChange}
          className="absolute inset-0"
        />
      </div>

      {/* Barra de navegación de páginas de la libreta flotante */}
      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 z-20 select-none">
        <button
          title="Página Anterior"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className={`p-1.5 rounded-xl transition-all ${
            currentPage > 1 ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        <span className="text-xs font-semibold text-slate-300 min-w-[70px] text-center">
          Pág. {currentPage} / {totalPages}
        </span>

        <button
          title="Página Siguiente"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className={`p-1.5 rounded-xl transition-all ${
            currentPage < totalPages ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
          }`}
        >
          <ChevronRight size={20} />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        <button
          title="Añadir Nueva Página"
          onClick={onAddPage}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
        >
          <Plus size={15} />
          <span>Nueva Página</span>
        </button>

        <button
          title="Exportar a Imagen PNG"
          onClick={handleExportPNG}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
        >
          <Download size={15} />
          <span>PNG</span>
        </button>
      </footer>
    </div>
  );
};
