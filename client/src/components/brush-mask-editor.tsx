import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Eraser, Paintbrush, Undo2, Trash2, Check, X } from "lucide-react";

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

interface BrushMaskEditorProps {
  imageUrl: string;
  onConfirm: (maskDataUrl: string) => void;
  onCancel: () => void;
}

export function BrushMaskEditor({ imageUrl, onConfirm, onCancel }: BrushMaskEditorProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [brushSize, setBrushSize] = useState(40);
  const [mode, setMode] = useState<"paint" | "erase">("paint");
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load background image
  useEffect(() => {
    const bgCanvas = bgCanvasRef.current;
    if (!bgCanvas) return;
    const ctx = bgCanvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Save current mask state to undo stack
  const pushUndo = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setUndoStack((prev) => {
      const next = [...prev, data];
      // Keep max 20 undo steps
      if (next.length > 20) next.shift();
      return next;
    });
  }, []);

  // Convert pointer event to canvas coordinates
  const getCanvasPos = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const drawAt = useCallback(
    (x: number, y: number) => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) return;

      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      if (mode === "paint") {
        ctx.fillStyle = "rgba(147, 51, 234, 0.45)"; // purple overlay
        ctx.globalCompositeOperation = "source-over";
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = "destination-out";
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }
    },
    [brushSize, mode]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      pushUndo();
      setIsDrawing(true);
      const pos = getCanvasPos(e);
      drawAt(pos.x, pos.y);
    },
    [pushUndo, getCanvasPos, drawAt]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const pos = getCanvasPos(e);
      drawAt(pos.x, pos.y);
    },
    [isDrawing, getCanvasPos, drawAt]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleUndo = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas || undoStack.length === 0) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    const prev = undoStack[undoStack.length - 1];
    ctx.putImageData(prev, 0, 0);
    setUndoStack((s) => s.slice(0, -1));
  }, [undoStack]);

  const handleClear = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;
    pushUndo();
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, [pushUndo]);

  const handleConfirm = useCallback(() => {
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    const ctx = maskCanvas.getContext("2d");
    if (!ctx) return;

    // Read the mask overlay and produce white-on-black PNG
    const maskData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const outputCanvas = document.createElement("canvas");
    outputCanvas.width = CANVAS_WIDTH;
    outputCanvas.height = CANVAS_HEIGHT;
    const outCtx = outputCanvas.getContext("2d")!;
    const outData = outCtx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < maskData.data.length; i += 4) {
      // Any non-transparent pixel in the mask overlay → white, else black
      const hasContent = maskData.data[i + 3] > 10;
      outData.data[i] = hasContent ? 255 : 0;     // R
      outData.data[i + 1] = hasContent ? 255 : 0; // G
      outData.data[i + 2] = hasContent ? 255 : 0; // B
      outData.data[i + 3] = 255;                   // A
    }

    outCtx.putImageData(outData, 0, 0);
    const dataUrl = outputCanvas.toDataURL("image/png");
    onConfirm(dataUrl);
  }, [onConfirm]);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant={mode === "paint" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("paint")}
        >
          <Paintbrush className="w-4 h-4 mr-1" /> Paint
        </Button>
        <Button
          type="button"
          variant={mode === "erase" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("erase")}
        >
          <Eraser className="w-4 h-4 mr-1" /> Erase
        </Button>
        <div className="h-5 w-px bg-border mx-1" />
        <Button type="button" variant="outline" size="sm" onClick={handleUndo} disabled={undoStack.length === 0}>
          <Undo2 className="w-4 h-4 mr-1" /> Undo
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleClear}>
          <Trash2 className="w-4 h-4 mr-1" /> Clear
        </Button>
      </div>

      {/* Brush size slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground whitespace-nowrap">Brush size</span>
        <Slider
          min={10}
          max={120}
          step={2}
          value={[brushSize]}
          onValueChange={([v]) => setBrushSize(v)}
          className="flex-1 max-w-[200px]"
        />
        <span className="text-xs text-muted-foreground w-8 text-right">{brushSize}</span>
      </div>

      {/* Canvas area */}
      <div
        ref={containerRef}
        className="relative w-full border rounded-lg overflow-hidden bg-black"
        style={{ aspectRatio: "16/9" }}
      >
        <canvas
          ref={bgCanvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="absolute inset-0 w-full h-full"
        />
        <canvas
          ref={maskCanvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            Loading image...
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Paint over the person you want to keep in the thumbnail. Only the painted area will be used.
      </p>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
        <Button
          type="button"
          className="bg-purple-600 text-white hover:bg-purple-700"
          size="sm"
          onClick={handleConfirm}
        >
          <Check className="w-4 h-4 mr-1" /> Confirm Selection
        </Button>
      </div>
    </div>
  );
}
