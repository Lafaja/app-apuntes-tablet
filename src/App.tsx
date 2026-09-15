import { useState, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { NotebookView } from './components/NotebookView';
import { PdfView } from './components/PdfView';
import type { ToolType, BackgroundColor, GridType, Stroke } from './types/drawing';

// Clave para almacenamiento local en la tablet
const STORAGE_KEY_NOTES = 'tablet_app_notebook_pages';
const STORAGE_KEY_PDF = 'tablet_app_pdf_annotations';

export function App() {
  // Estado de herramientas de dibujo
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#0f172a');
  const [size, setSize] = useState<number>(3);
  const [backgroundColor, setBackgroundColor] = useState<BackgroundColor>('cream');
  const [gridType, setGridType] = useState<GridType>('grid');

  // Modo de visualización: 'pdf' | 'notes' | 'split'
  const [viewMode, setViewMode] = useState<'pdf' | 'notes' | 'split'>('split');

  // Estado de la libreta de apuntes (Páginas y trazos)
  const [notebookPages, setNotebookPages] = useState<Record<number, Stroke[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      return saved ? JSON.parse(saved) : { 1: [] };
    } catch {
      return { 1: [] };
    }
  });
  const [currentNotebookPage, setCurrentNotebookPage] = useState<number>(1);
  const [totalNotebookPages, setTotalNotebookPages] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTES);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Math.max(Object.keys(parsed).length, 1);
      }
      return 1;
    } catch {
      return 1;
    }
  });

  // Historial de deshacer/rehacer para la libreta
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[][]>([]);

  // Estado de anotaciones del PDF (Página -> Trazos)
  const [pdfAnnotations, setPdfAnnotations] = useState<Record<number, Stroke[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PDF);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Guardar automáticamente en el almacenamiento local de la tablet
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notebookPages));
    } catch (e) {
      console.warn('Almacenamiento lleno o no disponible:', e);
    }
  }, [notebookPages]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PDF, JSON.stringify(pdfAnnotations));
    } catch (e) {
      console.warn('Almacenamiento lleno o no disponible:', e);
    }
  }, [pdfAnnotations]);

  // Manejar cambios de trazos en la libreta con historial Undo/Redo
  const handleNotebookStrokesChange = (newStrokes: Stroke[]) => {
    const currentStrokes = notebookPages[currentNotebookPage] || [];
    setUndoStack((prev) => [...prev, currentStrokes]);
    setRedoStack([]); // Vaciar rehacer al hacer un nuevo trazo
    setNotebookPages((prev) => ({
      ...prev,
      [currentNotebookPage]: newStrokes,
    }));
  };

  // Manejar cambios de anotaciones en el PDF
  const handlePdfAnnotationsChange = (page: number, newStrokes: Stroke[]) => {
    setPdfAnnotations((prev) => ({
      ...prev,
      [page]: newStrokes,
    }));
  };

  // Deshacer (Undo)
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const currentStrokes = notebookPages[currentNotebookPage] || [];

    setRedoStack((prev) => [...prev, currentStrokes]);
    setUndoStack((prev) => prev.slice(0, -1));

    setNotebookPages((prev) => ({
      ...prev,
      [currentNotebookPage]: previous,
    }));
  };

  // Rehacer (Redo)
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const currentStrokes = notebookPages[currentNotebookPage] || [];

    setUndoStack((prev) => [...prev, currentStrokes]);
    setRedoStack((prev) => prev.slice(0, -1));

    setNotebookPages((prev) => ({
      ...prev,
      [currentNotebookPage]: next,
    }));
  };

  // Limpiar página actual
  const handleClear = () => {
    if (window.confirm('¿Deseas borrar todos los trazos de la página actual?')) {
      const currentStrokes = notebookPages[currentNotebookPage] || [];
      if (currentStrokes.length > 0) {
        setUndoStack((prev) => [...prev, currentStrokes]);
        setRedoStack([]);
        setNotebookPages((prev) => ({
          ...prev,
          [currentNotebookPage]: [],
        }));
      }
    }
  };

  // Añadir nueva página a la libreta
  const handleAddPage = () => {
    const newPageNum = totalNotebookPages + 1;
    setTotalNotebookPages(newPageNum);
    setNotebookPages((prev) => ({
      ...prev,
      [newPageNum]: [],
    }));
    setCurrentNotebookPage(newPageNum);
    setUndoStack([]);
    setRedoStack([]);
  };

  // Cambiar página de la libreta
  const handlePageChange = (page: number) => {
    setCurrentNotebookPage(page);
    setUndoStack([]);
    setRedoStack([]);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden font-sans">
      {/* Barra de herramientas superior */}
      <Toolbar
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        size={size}
        setSize={setSize}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        backgroundColor={backgroundColor}
        setBackgroundColor={setBackgroundColor}
        gridType={gridType}
        setGridType={setGridType}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Área principal de trabajo con soporte de pantalla dual / dividida */}
      <main className="flex-1 w-full h-[calc(100vh-3.5rem)] flex overflow-hidden">
        {/* Panel PDF (Izquierda) */}
        {(viewMode === 'pdf' || viewMode === 'split') && (
          <div
            className={`h-full overflow-hidden transition-all duration-300 ${
              viewMode === 'split' ? 'w-1/2 border-r border-slate-800' : 'w-full'
            }`}
          >
            <PdfView
              tool={tool}
              color={color}
              size={size}
              pdfAnnotations={pdfAnnotations}
              onAnnotationsChange={handlePdfAnnotationsChange}
            />
          </div>
        )}

        {/* Panel Libreta de Apuntes (Derecha) */}
        {(viewMode === 'notes' || viewMode === 'split') && (
          <div
            className={`h-full overflow-hidden transition-all duration-300 ${
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            }`}
          >
            <NotebookView
              tool={tool}
              color={color}
              size={size}
              backgroundColor={backgroundColor}
              gridType={gridType}
              strokes={notebookPages[currentNotebookPage] || []}
              onStrokesChange={handleNotebookStrokesChange}
              currentPage={currentNotebookPage}
              totalPages={totalNotebookPages}
              onPageChange={handlePageChange}
              onAddPage={handleAddPage}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
