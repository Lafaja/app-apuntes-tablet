import { useRef, useEffect, useCallback, type FC, type PointerEvent } from 'react';
import type { ToolType, Stroke, Point } from '../types/drawing';

interface DrawingCanvasProps {
  width: number;
  height: number;
  tool: ToolType;
  color: string;
  size: number;
  opacity?: number;
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  className?: string;
  readOnly?: boolean;
}

export const DrawingCanvas: FC<DrawingCanvasProps> = ({
  width,
  height,
  tool,
  color,
  size,
  opacity = 1,
  strokes,
  onStrokesChange,
  className = '',
  readOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  // Redibujar todos los trazos con escalado de alta densidad (DPI)
  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const allStrokes = [...strokes];
    if (currentStrokeRef.current) {
      allStrokes.push(currentStrokeRef.current);
    }

    allStrokes.forEach((stroke) => {
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
  }, [strokes]);

  // Actualizar resolución del canvas para pantallas retina/tablet
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    redrawAll();
  }, [width, height, redrawAll]);

  // Manejadores de Pointer Events optimizados para Stylus y dedos
  const getCanvasCoordinates = (e: PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    };
  };

  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || tool === 'pan') return;

    // Solo responder al botón principal / toque stylus
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const point = getCanvasCoordinates(e);

    if (tool === 'eraser') {
      // Borrador de trazos directo si toca algún trazo cercano
      const strokeRadius = Math.max(size * 1.5, 12);
      const filtered = strokes.filter((s) => {
        return !s.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < strokeRadius);
      });
      if (filtered.length !== strokes.length) {
        onStrokesChange(filtered);
      }
      return;
    }

    currentStrokeRef.current = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      tool,
      color,
      size,
      opacity,
      points: [point],
    };

    redrawAll();
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || readOnly || tool === 'pan') return;

    const point = getCanvasCoordinates(e);

    if (tool === 'eraser') {
      const strokeRadius = Math.max(size * 1.5, 12);
      const filtered = strokes.filter((s) => {
        return !s.points.some((p) => Math.hypot(p.x - point.x, p.y - point.y) < strokeRadius);
      });
      if (filtered.length !== strokes.length) {
        onStrokesChange(filtered);
      }
      return;
    }

    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push(point);
      redrawAll();
    }
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignorar si ya fue liberado
    }
    isDrawingRef.current = false;

    if (currentStrokeRef.current && currentStrokeRef.current.points.length > 0) {
      const updated = [...strokes, currentStrokeRef.current];
      currentStrokeRef.current = null;
      onStrokesChange(updated);
    }
    redrawAll();
  };

  return (
    <canvas
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`touch-none select-none cursor-crosshair ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        touchAction: 'none',
      }}
    />
  );
};
