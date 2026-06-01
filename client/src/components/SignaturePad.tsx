import { useRef, useState, useEffect, useCallback } from 'react';
import { X, Trash2, Upload, PenLine, Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
  existing?: string;
}

export default function SignaturePad({ onSave, onClose, existing }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const lastPos = useRef({ x: 0, y: 0 });

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    lastPos.current = pos;
    setIsDrawing(true);
    setHasDrawn(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    initCanvas();
    setHasDrawn(false);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setUploadPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (tab === 'upload' && uploadPreview) {
      onSave(uploadPreview);
      return;
    }
    if (tab === 'draw' && hasDrawn && canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'));
    }
  };

  const canSave = (tab === 'draw' && hasDrawn) || (tab === 'upload' && !!uploadPreview);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-bounce-in overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-800 tracking-tight">Add Signature</h2>
            <p className="text-xs text-slate-400 mt-0.5">Draw or upload your signature — it appears on all documents</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-50 border-b border-slate-100">
          {(['draw', 'upload'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all',
                tab === t
                  ? 'bg-white text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {t === 'draw' ? <PenLine className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {t === 'draw' ? 'Draw' : 'Upload Image'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">

          {tab === 'draw' && (
            <div>
              <div className="relative rounded-xl border-2 border-dashed border-slate-200 overflow-hidden bg-white">
                {/* Guide line */}
                <div className="absolute bottom-10 left-6 right-6 border-b border-slate-200 pointer-events-none" />
                <div className="absolute bottom-6 left-6 text-[10px] text-slate-300 font-medium pointer-events-none select-none">
                  Sign above the line
                </div>
                <canvas
                  ref={canvasRef}
                  width={480}
                  height={180}
                  className="w-full touch-none cursor-crosshair"
                  style={{ display: 'block' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={stopDraw}
                />
              </div>
              {!hasDrawn && (
                <p className="text-center text-xs text-slate-400 mt-3">Draw your signature in the box above</p>
              )}
              {hasDrawn && (
                <button
                  onClick={clearCanvas}
                  className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-semibold transition-colors mx-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear & redo
                </button>
              )}
            </div>
          )}

          {tab === 'upload' && (
            <div>
              <label className="block cursor-pointer">
                <input type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleUpload} />
                {uploadPreview ? (
                  <div className="relative rounded-xl border-2 border-slate-200 overflow-hidden bg-white p-4 flex items-center justify-center min-h-[120px]">
                    <img src={uploadPreview} alt="Signature preview" className="max-h-24 max-w-full object-contain" />
                    <div className="absolute top-2 right-2 text-xs text-slate-400 hover:text-slate-600 font-medium">click to change</div>
                  </div>
                ) : (
                  <div className="rounded-xl border-2 border-dashed border-slate-200 p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/30 transition-all">
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-500">Click to upload signature</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG or SVG — transparent background recommended</p>
                  </div>
                )}
              </label>
              {uploadPreview && (
                <button
                  onClick={() => setUploadPreview(null)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 font-semibold transition-colors mx-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>
          )}

          {/* Existing preview */}
          {existing && !hasDrawn && !uploadPreview && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
              <img src={existing} alt="Current signature" className="max-h-10 max-w-[140px] object-contain" />
              <p className="text-xs text-slate-400">Current saved signature — draw or upload to replace it</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 transition-all btn-glow"
          >
            <Check className="w-4 h-4" /> Save Signature
          </button>
        </div>
      </div>
    </div>
  );
}
