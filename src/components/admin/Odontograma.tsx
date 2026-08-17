import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  XCircle, 
  ShieldCheck, 
  AlertCircle, 
  Wrench, 
  Activity, 
  Layers
} from "lucide-react";

export type ToothState = "Sano" | "Caries" | "Empaste" | "Ausente" | "Implante" | "Endodoncia" | "Corona";

export type ToothRecord = {
  tooth_number: number;
  state: ToothState;
  notes?: string;
};

// Dual FDI mapping (Adult / Child)
const UPPER_RIGHT = [
  { adult: 18, child: null },
  { adult: 17, child: null },
  { adult: 16, child: null },
  { adult: 15, child: 55 },
  { adult: 14, child: 54 },
  { adult: 13, child: 53 },
  { adult: 12, child: 52 },
  { adult: 11, child: 51 },
];

const UPPER_LEFT = [
  { adult: 21, child: 61 },
  { adult: 22, child: 62 },
  { adult: 23, child: 63 },
  { adult: 24, child: 64 },
  { adult: 25, child: 65 },
  { adult: 26, child: null },
  { adult: 27, child: null },
  { adult: 28, child: null },
];

const LOWER_RIGHT = [
  { adult: 48, child: null },
  { adult: 47, child: null },
  { adult: 46, child: null },
  { adult: 45, child: 85 },
  { adult: 44, child: 84 },
  { adult: 43, child: 83 },
  { adult: 42, child: 82 },
  { adult: 41, child: 81 },
];

const LOWER_LEFT = [
  { adult: 31, child: 71 },
  { adult: 32, child: 72 },
  { adult: 33, child: 73 },
  { adult: 34, child: 74 },
  { adult: 35, child: 75 },
  { adult: 36, child: null },
  { adult: 37, child: null },
  { adult: 38, child: null },
];

const STATE_CONFIG: Record<ToothState, { label: string; color: string; fill: string; stroke: string; icon: any }> = {
  Sano: { label: "Sano", color: "border-slate-300 text-slate-700 bg-white", fill: "#ffffff", stroke: "#334155", icon: ShieldCheck },
  Caries: { label: "Caries", color: "border-red-500 text-red-600 bg-red-50", fill: "#ef4444", stroke: "#b91c1c", icon: AlertCircle },
  Empaste: { label: "Empaste", color: "border-blue-500 text-blue-600 bg-blue-50", fill: "#3b82f6", stroke: "#1d4ed8", icon: Wrench },
  Ausente: { label: "Ausente", color: "border-slate-700 text-slate-800 bg-slate-100", fill: "#94a3b8", stroke: "#334155", icon: XCircle },
  Implante: { label: "Implante", color: "border-purple-500 text-purple-600 bg-purple-50", fill: "#a855f7", stroke: "#7e22ce", icon: Activity },
  Endodoncia: { label: "Endodoncia", color: "border-amber-500 text-amber-600 bg-amber-50", fill: "#f59e0b", stroke: "#b45309", icon: Layers },
  Corona: { label: "Corona", color: "border-emerald-500 text-emerald-600 bg-emerald-50", fill: "#10b981", stroke: "#047857", icon: Sparkles },
};

interface OdontogramaProps {
  records: Record<number, ToothRecord>;
  onUpdateTooth: (tooth: number, state: ToothState, notes: string) => void;
  readonly?: boolean;
}

export function Odontograma({ records, onUpdateTooth, readonly = false }: OdontogramaProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<ToothState>("Caries");
  const [editState, setEditState] = useState<ToothState>("Sano");
  const [editNotes, setEditNotes] = useState("");

  const handleToothClick = (num: number) => {
    if (readonly) return;
    const current = records[num]?.state || "Sano";
    // Quick paint with active tool if tool is chosen, otherwise select
    if (activeTool && activeTool !== current) {
      onUpdateTooth(num, activeTool, records[num]?.notes || "");
    } else {
      setSelectedTooth(num);
      const existing = records[num];
      setEditState(existing?.state || "Sano");
      setEditNotes(existing?.notes || "");
    }
  };

  const handleSaveModal = () => {
    if (selectedTooth !== null) {
      onUpdateTooth(selectedTooth, editState, editNotes);
      setSelectedTooth(null);
    }
  };

  // Anatomical Tooth Renderer (Vector SVG with Crown and Roots)
  const AnatomicalToothSVG = ({ num, isUpper }: { num: number; isUpper: boolean }) => {
    const record = records[num];
    const toothState = record?.state || "Sano";
    const config = STATE_CONFIG[toothState];

    // Determine anatomical shape class
    const isMolar = [18, 17, 16, 26, 27, 28, 48, 47, 46, 36, 37, 38].includes(num);
    const isPremolar = [15, 14, 24, 25, 45, 44, 34, 35].includes(num);

    return (
      <div 
        onClick={() => handleToothClick(num)}
        className={cn(
          "group relative flex flex-col items-center cursor-pointer select-none transition-all p-1 rounded-xl",
          "hover:bg-blue-50/60 dark:hover:bg-blue-950/40 hover:scale-105",
          selectedTooth === num && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950",
          toothState === "Ausente" && "opacity-40"
        )}
      >
        {/* Anatomical Graphic */}
        <div className="relative w-8 h-20 sm:w-10 sm:h-24 flex items-center justify-center">
          <svg 
            viewBox="0 0 100 220" 
            className="w-full h-full drop-shadow-xs overflow-visible"
            style={{ transform: isUpper ? "none" : "scaleY(-1)" }}
          >
            {/* Roots (Top for Upper, Bottom for Lower via scaleY) */}
            {isMolar ? (
              // 3 Roots for Molars
              <path
                d="M 20 110 C 15 60, 5 30, 25 10 C 35 30, 40 70, 50 100 C 60 70, 65 30, 75 10 C 95 30, 85 60, 80 110 Z"
                fill={toothState === "Endodoncia" ? config.fill : (toothState !== "Sano" && toothState !== "Ausente" ? config.fill + "40" : "#ffffff")}
                stroke="#475569"
                strokeWidth="4"
              />
            ) : isPremolar ? (
              // 2 Roots for Premolars
              <path
                d="M 25 110 C 20 60, 15 25, 35 12 C 45 40, 55 40, 65 12 C 85 25, 80 60, 75 110 Z"
                fill={toothState === "Endodoncia" ? config.fill : (toothState !== "Sano" && toothState !== "Ausente" ? config.fill + "40" : "#ffffff")}
                stroke="#475569"
                strokeWidth="4"
              />
            ) : (
              // Single Root for Incisors/Canines
              <path
                d="M 30 110 C 25 60, 35 15, 50 8 C 65 15, 75 60, 70 110 Z"
                fill={toothState === "Endodoncia" ? config.fill : (toothState !== "Sano" && toothState !== "Ausente" ? config.fill + "40" : "#ffffff")}
                stroke="#475569"
                strokeWidth="4"
              />
            )}

            {/* Cemento-enamel junction line */}
            <path
              d="M 15 110 C 35 118, 65 118, 85 110"
              fill="none"
              stroke="#64748b"
              strokeWidth="3"
            />

            {/* Crown (Coronal Head) */}
            <path
              d="M 15 110 C 10 135, 12 190, 30 205 C 50 215, 70 215, 87 205 C 100 190, 90 135, 85 110 Z"
              fill={toothState !== "Sano" && toothState !== "Ausente" ? config.fill : "#ffffff"}
              stroke={toothState !== "Sano" ? config.stroke : "#334155"}
              strokeWidth="5"
            />

            {/* Internal Anatomical Grooves / Fissures */}
            {isMolar && (
              <path
                d="M 35 140 Q 50 170 65 140 M 50 130 L 50 195"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="3"
              />
            )}
          </svg>

          {/* Special State Overlays */}
          {toothState === "Ausente" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-red-600 font-extrabold text-3xl">✕</span>
            </div>
          )}
          {toothState === "Implante" && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-purple-600 text-white rounded-full p-1 shadow-md">
              <Activity className="w-3.5 h-3.5" />
            </div>
          )}
          {toothState === "Corona" && (
            <div className="absolute inset-0 border-2 border-emerald-500 rounded-xl pointer-events-none bg-emerald-500/20" />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-card rounded-2xl border border-border shadow-sm space-y-6">
      {/* Header & Tool Selection */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            Odontograma Clínico Anatómico (Terapia)
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Sistema FDI Dual (Adulto / Infantil)
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Vista anatómica de coronas y raíces dentales. Selecciona una herramienta para pintar directamente.
          </p>
        </div>

        {/* State Toolbar */}
        {!readonly && (
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-border">
            {(Object.keys(STATE_CONFIG) as ToothState[]).map((state) => {
              const Icon = STATE_CONFIG[state].icon;
              const isActive = activeTool === state;
              return (
                <Button
                  key={state}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "h-7 text-xs gap-1 px-2.5 transition-all",
                    isActive && "shadow-xs font-semibold"
                  )}
                  onClick={() => setActiveTool(state)}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {state}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Chart Area with Horizontal Grid Lines (Matching Clinical Chart Image) */}
      <div className="relative p-6 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/80 dark:from-slate-900/40 dark:via-slate-900 dark:to-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 overflow-x-auto">
        
        {/* Background Subtle Clinical Grid Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-25 flex flex-col justify-between p-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="border-b border-slate-400 w-full h-0" />
          ))}
        </div>

        {/* Central Vertical Dividing Axis (Right R / Left L) */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-r-2 border-slate-300 dark:border-slate-700 pointer-events-none z-0" />

        <div className="relative z-10 space-y-6">
          
          {/* MAXILAR SUPERIOR (UPPER ARCH) */}
          <div className="space-y-2">
            <div className="flex justify-center gap-1 sm:gap-2">
              {/* Upper Right (Quadrant 1) */}
              <div className="flex gap-0.5 sm:gap-1">
                {UPPER_RIGHT.map(({ adult }) => (
                  <AnatomicalToothSVG key={adult} num={adult} isUpper={true} />
                ))}
              </div>

              {/* Center Divider Spacer */}
              <div className="w-4 flex items-center justify-center font-bold text-slate-400 text-sm">R</div>

              {/* Upper Left (Quadrant 2) */}
              <div className="flex gap-0.5 sm:gap-1">
                {UPPER_LEFT.map(({ adult }) => (
                  <AnatomicalToothSVG key={adult} num={adult} isUpper={true} />
                ))}
              </div>
            </div>

            {/* UPPER NUMBERING ROW (Black Adult / Blue Child) */}
            <div className="flex justify-center gap-1 sm:gap-2 pt-1 border-t border-slate-200 dark:border-slate-800">
              <div className="flex gap-0.5 sm:gap-1">
                {UPPER_RIGHT.map(({ adult, child }) => (
                  <div key={adult} className="w-8 sm:w-10 text-center font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {adult}
                    {child && <span className="text-blue-500 font-semibold">/{child}</span>}
                  </div>
                ))}
              </div>

              <div className="w-4 text-center text-xs font-bold text-slate-400">|</div>

              <div className="flex gap-0.5 sm:gap-1">
                {UPPER_LEFT.map(({ adult, child }) => (
                  <div key={adult} className="w-8 sm:w-10 text-center font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {adult}
                    {child && <span className="text-blue-500 font-semibold">/{child}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* LOWER NUMBERING ROW */}
          <div className="space-y-2 pt-4">
            <div className="flex justify-center gap-1 sm:gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
              <div className="flex gap-0.5 sm:gap-1">
                {LOWER_RIGHT.map(({ adult, child }) => (
                  <div key={adult} className="w-8 sm:w-10 text-center font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {adult}
                    {child && <span className="text-blue-500 font-semibold">/{child}</span>}
                  </div>
                ))}
              </div>

              <div className="w-4 text-center text-xs font-bold text-slate-400">L</div>

              <div className="flex gap-0.5 sm:gap-1">
                {LOWER_LEFT.map(({ adult, child }) => (
                  <div key={adult} className="w-8 sm:w-10 text-center font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {adult}
                    {child && <span className="text-blue-500 font-semibold">/{child}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* MANDÍBULA INFERIOR (LOWER ARCH) */}
            <div className="flex justify-center gap-1 sm:gap-2">
              {/* Lower Right (Quadrant 4) */}
              <div className="flex gap-0.5 sm:gap-1">
                {LOWER_RIGHT.map(({ adult }) => (
                  <AnatomicalToothSVG key={adult} num={adult} isUpper={false} />
                ))}
              </div>

              <div className="w-4 flex items-center justify-center font-bold text-slate-400 text-sm"></div>

              {/* Lower Left (Quadrant 3) */}
              <div className="flex gap-0.5 sm:gap-1">
                {LOWER_LEFT.map(({ adult }) => (
                  <AnatomicalToothSVG key={adult} num={adult} isUpper={false} />
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Detalle del Diente N° {selectedTooth}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-3">
            <div className="grid gap-2">
              <Label className="text-xs font-bold">Diagnóstico / Estado</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATE_CONFIG) as ToothState[]).map((state) => (
                  <Button
                    key={state}
                    type="button"
                    size="sm"
                    variant={editState === state ? "default" : "outline"}
                    className={cn(
                      "text-xs transition-all",
                      editState === state && STATE_CONFIG[state].color
                    )}
                    onClick={() => setEditState(state)}
                  >
                    {state}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="text-xs font-bold">Observaciones Clínicas</Label>
              <Textarea
                id="notes"
                placeholder="Escribe anotaciones clínicas sobre esta pieza..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedTooth(null)}>Cancelar</Button>
            <Button onClick={handleSaveModal}>Guardar en Historial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
