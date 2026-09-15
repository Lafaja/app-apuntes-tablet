import { useState, useEffect, useRef, type FC, type ChangeEvent } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  Upload,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download
} from 'lucide-react';
import { DrawingCanvas } from './DrawingCanvas';
import type { ToolType, Stroke } from '../types/drawing';

// Configuración del worker de PDF.js para Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfViewProps {
  tool: ToolType;
  color: string;
  size: number;
  pdfAnnotations: Record<number, Stroke[]>;
  onAnnotationsChange: (page: number, strokes: Stroke[]) => void;
}

export const PdfView: FC<PdfViewProps> = ({
  tool,
  color,
  size,
  pdfAnnotations,
  onAnnotationsChange,
}) => {
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cargar PDF desde archivo local
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error al abrir PDF:', err);
      alert('Error al leer el archivo PDF');
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar la página actual en el canvas nativo de PDF.js
  useEffect(() => {
    if (!pdfDoc) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale });
        const dpr = window.devicePixelRatio || 1;

        setPageDimensions({
          width: viewport.width,
          height: viewport.height,
        });

        const canvas = pdfCanvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Renderizado nítido en alta resolución
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Error renderizando página PDF:', err);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, currentPage, scale]);

  // Exportar página del PDF combinando el documento + anotaciones manuscritas
  const handleExportPage = () => {
    if (!pdfCanvasRef.current) return;

    const exportCanvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 1;
    exportCanvas.width = pageDimensions.width * dpr;
    exportCanvas.height = pageDimensions.height * dpr;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Dibujar el fondo del PDF original
    ctx.drawImage(pdfCanvasRef.current, 0, 0);

    // 2. Dibujar las anotaciones manuscritas de la página
    const currentStrokes = pdfAnnotations[currentPage] || [];
    ctx.scale(dpr, dpr);

    currentStrokes.forEach((stroke) => {
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
    link.download = `${fileName ? fileName.replace('.pdf', '') : 'pdf'}-anotado-p${currentPage}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  const currentStrokes = pdfAnnotations[currentPage] || [];

  return (
    <div className="flex-1 h-full bg-slate-950 flex flex-col items-center justify-between overflow-y-auto p-3 relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Si no hay PDF cargado */}
      {!pdfDoc && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 max-w-md">
          <div className="w-20 h-20 bg-blue-600/10 text-blue-400 rounded-3xl flex items-center justify-center mb-4 border border-blue-500/20">
            <Upload size={38} />
          </div>
          <h3 className="text-lg font-semibold text-slate-200 mb-2">
            No hay ningún PDF abierto
          </h3>
          <p className="text-sm text-slate-400 mb-6">
            Selecciona un archivo PDF desde el almacenamiento local de tu tablet para leerlo y hacer anotaciones sobre él.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg transition-all active:scale-95"
          >
            <Upload size={18} />
            <span>Abrir PDF Local</span>
          </button>
        </div>
      )}

      {/* Indicador de carga */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Cargando documento PDF...</p>
        </div>
      )}

      {/* Contenedor del PDF y Lienzo de Anotaciones */}
      {pdfDoc && !isLoading && (
        <div
          className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700/60 bg-white"
          style={{
            width: `${pageDimensions.width}px`,
            height: `${pageDimensions.height}px`,
          }}
        >
          {/* Capa 1: Canvas de PDF.js */}
          <canvas ref={pdfCanvasRef} className="absolute inset-0 select-none pointer-events-none" />

          {/* Capa 2: Canvas de Dibujo / Stylus Overlay */}
          <DrawingCanvas
            width={pageDimensions.width}
            height={pageDimensions.height}
            tool={tool}
            color={color}
            size={size}
            strokes={currentStrokes}
            onStrokesChange={(strokes) => onAnnotationsChange(currentPage, strokes)}
            className="absolute inset-0"
          />
        </div>
      )}

      {/* Barra de navegación del PDF flotante */}
      {pdfDoc && (
        <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 z-20 select-none">
          <button
            title="Cambiar Archivo PDF"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all"
          >
            <Upload size={14} />
            <span className="hidden sm:inline">Cambiar</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Navegación de páginas */}
          <button
            title="Página Anterior"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            className={`p-1.5 rounded-xl transition-all ${
              currentPage > 1 ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-xs font-semibold text-slate-300 min-w-[75px] text-center">
            Pág. {currentPage} / {totalPages}
          </span>

          <button
            title="Página Siguiente"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            className={`p-1.5 rounded-xl transition-all ${
              currentPage < totalPages ? 'hover:bg-slate-800 text-slate-200' : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={20} />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Controles de Zoom */}
          <button
            title="Reducir Zoom"
            onClick={() => setScale((s) => Math.max(0.6, s - 0.2))}
            className="p-1.5 hover:bg-slate-800 text-slate-200 rounded-xl transition-all"
          >
            <ZoomOut size={17} />
          </button>

          <span className="text-xs text-slate-400 font-mono w-10 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            title="Aumentar Zoom"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="p-1.5 hover:bg-slate-800 text-slate-200 rounded-xl transition-all"
          >
            <ZoomIn size={17} />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Botón de Exportar */}
          <button
            title="Exportar Página con Anotaciones"
            onClick={handleExportPage}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-md active:scale-95"
          >
            <Download size={14} />
            <span>Exportar</span>
          </button>
        </footer>
      )}
    </div>
  );
};
