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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  XCircle, 
  ShieldCheck, 
  AlertCircle, 
  Wrench, 
  Activity, 
  Layers,
  Baby,
  User
} from "lucide-react";

export type ToothState = "Sano" | "Caries" | "Empaste" | "Ausente" | "Implante" | "Endodoncia" | "Corona";

export type ToothSurface = "oclusal" | "vestibular" | "lingual" | "mesial" | "distal";

export type ToothRecord = {
  tooth_number: number;
  state: ToothState;
  surfaces?: Partial<Record<ToothSurface, ToothState>>;
  notes?: string;
};

// Adult teeth numbering (FDI system)
const ADULT_TEETH_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const ADULT_TEETH_UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const ADULT_TEETH_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const ADULT_TEETH_LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

// Child teeth numbering (FDI system)
const CHILD_TEETH_UPPER_RIGHT = [55, 54, 53, 52, 51];
const CHILD_TEETH_UPPER_LEFT  = [61, 62, 63, 64, 65];
const CHILD_TEETH_LOWER_RIGHT = [85, 84, 83, 82, 81];
const CHILD_TEETH_LOWER_LEFT  = [71, 72, 73, 74, 75];

const STATE_CONFIG: Record<ToothState, { label: string; color: string; fill: string; icon: any }> = {
  Sano: { label: "Sano", color: "border-slate-300 text-slate-700 bg-white", fill: "#f8fafc", icon: ShieldCheck },
  Caries: { label: "Caries", color: "border-red-500 text-red-600 bg-red-50", fill: "#ef4444", icon: AlertCircle },
  Empaste: { label: "Empaste", color: "border-blue-500 text-blue-600 bg-blue-50", fill: "#3b82f6", icon: Wrench },
  Ausente: { label: "Ausente", color: "border-slate-700 text-slate-800 bg-slate-100", fill: "#334155", icon: XCircle },
  Implante: { label: "Implante", color: "border-purple-500 text-purple-600 bg-purple-50", fill: "#a855f7", icon: Activity },
  Endodoncia: { label: "Endodoncia", color: "border-amber-500 text-amber-600 bg-amber-50", fill: "#f59e0b", icon: Layers },
  Corona: { label: "Corona", color: "border-emerald-500 text-emerald-600 bg-emerald-50", fill: "#10b981", icon: Sparkles },
};

interface OdontogramaProps {
  records: Record<number, ToothRecord>;
  onUpdateTooth: (tooth: number, state: ToothState, notes: string, surfaces?: Partial<Record<ToothSurface, ToothState>>) => void;
  readonly?: boolean;
}

export function Odontograma({ records, onUpdateTooth, readonly = false }: OdontogramaProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [activeTool, setActiveTool] = useState<ToothState>("Caries");
  const [dentitionType, setDentitionType] = useState<"adult" | "child">("adult");
  const [editState, setEditState] = useState<ToothState>("Sano");
  const [editNotes, setEditNotes] = useState("");
  const [editSurfaces, setEditSurfaces] = useState<Partial<Record<ToothSurface, ToothState>>>({});

  const handleToothClick = (num: number) => {
    if (readonly) return;
    setSelectedTooth(num);
    const existing = records[num];
    setEditState(existing?.state || "Sano");
    setEditNotes(existing?.notes || "");
    setEditSurfaces(existing?.surfaces || {});
  };

  const handleSurfaceClick = (num: number, surface: ToothSurface, e: React.MouseEvent) => {
    if (readonly) return;
    e.stopPropagation();
    const existing = records[num] || { tooth_number: num, state: "Sano", surfaces: {} };
    const currentSurfaces = { ...(existing.surfaces || {}) };
    
    // Toggle active tool surface
    if (currentSurfaces[surface] === activeTool) {
      delete currentSurfaces[surface];
    } else {
      currentSurfaces[surface] = activeTool;
    }

    onUpdateTooth(num, existing.state === "Ausente" ? "Sano" : existing.state, existing.notes || "", currentSurfaces);
  };

  const handleSaveModal = () => {
    if (selectedTooth !== null) {
      onUpdateTooth(selectedTooth, editState, editNotes, editSurfaces);
      setSelectedTooth(null);
    }
  };

  // Anatomical Tooth SVG component
  const ToothSVG = ({ num }: { num: number }) => {
    const record = records[num];
    const toothState = record?.state || "Sano";
    const surfaces = record?.surfaces || {};

    const getSurfaceColor = (surface: ToothSurface) => {
      const surfState = surfaces[surface];
      if (surfState && STATE_CONFIG[surfState]) {
        return STATE_CONFIG[surfState].fill;
      }
      return "#ffffff";
    };

    return (
      <div 
        onClick={() => handleToothClick(num)}
        className={cn(
          "group relative flex flex-col items-center p-1.5 rounded-xl transition-all duration-200 cursor-pointer select-none",
          "hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:shadow-md",
          selectedTooth === num && "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-950/30",
          toothState === "Ausente" && "opacity-40"
        )}
      >
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1 group-hover:text-blue-600">
          {num}
        </span>

        {/* Anatomical 5-Surface Diagram */}
        <div className="relative w-11 h-11">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Top Surface (Vestibular) */}
            <polygon
              points="0,0 100,0 70,30 30,30"
              fill={getSurfaceColor("vestibular")}
              stroke="#94a3b8"
              strokeWidth="3"
              className="transition-colors hover:opacity-80"
              onClick={(e) => handleSurfaceClick(num, "vestibular", e)}
            />
            {/* Bottom Surface (Lingual) */}
            <polygon
              points="0,100 100,100 70,70 30,70"
              fill={getSurfaceColor("lingual")}
              stroke="#94a3b8"
              strokeWidth="3"
              className="transition-colors hover:opacity-80"
              onClick={(e) => handleSurfaceClick(num, "lingual", e)}
            />
            {/* Left Surface (Mesial) */}
            <polygon
              points="0,0 0,100 30,70 30,30"
              fill={getSurfaceColor("mesial")}
              stroke="#94a3b8"
              strokeWidth="3"
              className="transition-colors hover:opacity-80"
              onClick={(e) => handleSurfaceClick(num, "mesial", e)}
            />
            {/* Right Surface (Distal) */}
            <polygon
              points="100,0 100,100 70,70 70,30"
              fill={getSurfaceColor("distal")}
              stroke="#94a3b8"
              strokeWidth="3"
              className="transition-colors hover:opacity-80"
              onClick={(e) => handleSurfaceClick(num, "distal", e)}
            />
            {/* Center Surface (Oclusal/Incisal) */}
            <polygon
              points="30,30 70,30 70,70 30,70"
              fill={getSurfaceColor("oclusal")}
              stroke="#94a3b8"
              strokeWidth="3"
              className="transition-colors hover:opacity-80"
              onClick={(e) => handleSurfaceClick(num, "oclusal", e)}
            />
          </svg>

          {/* Overlays for special states */}
          {toothState === "Ausente" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-red-600 font-extrabold text-2xl">✕</span>
            </div>
          )}
          {toothState === "Implante" && (
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-purple-600 text-white rounded-full p-0.5 shadow">
              <Activity className="w-3 h-3" />
            </div>
          )}
          {toothState === "Endodoncia" && (
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full p-0.5 shadow">
              <Layers className="w-3 h-3" />
            </div>
          )}
          {toothState === "Corona" && (
            <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg pointer-events-none bg-emerald-500/10" />
          )}
        </div>

        {/* Small Status Badge */}
        {toothState !== "Sano" && toothState !== "Ausente" && (
          <span className={cn(
            "text-[9px] font-semibold px-1 rounded mt-1 truncate max-w-[48px]",
            STATE_CONFIG[toothState].color
          )}>
            {toothState}
          </span>
        )}
      </div>
    );
  };

  const isChild = dentitionType === "child";
  const upperRight = isChild ? CHILD_TEETH_UPPER_RIGHT : ADULT_TEETH_UPPER_RIGHT;
  const upperLeft  = isChild ? CHILD_TEETH_UPPER_LEFT  : ADULT_TEETH_UPPER_LEFT;
  const lowerRight = isChild ? CHILD_TEETH_LOWER_RIGHT : ADULT_TEETH_LOWER_RIGHT;
  const lowerLeft  = isChild ? CHILD_TEETH_LOWER_LEFT  : ADULT_TEETH_LOWER_LEFT;

  return (
    <div className="w-full max-w-5xl mx-auto p-6 bg-card rounded-2xl border border-border shadow-sm space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
            Odontograma Interactivo Pro
            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Anatómico FDI
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona una herramienta y haz clic en las superficies del diente para registrar hallazgos.
          </p>
        </div>

        {/* Dentition Selector Toggle */}
        <Tabs value={dentitionType} onValueChange={(v) => setDentitionType(v as any)} className="w-full md:w-auto">
          <TabsList className="grid grid-cols-2 w-full md:w-[220px]">
            <TabsTrigger value="adult" className="text-xs flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Adulta (32)
            </TabsTrigger>
            <TabsTrigger value="child" className="text-xs flex items-center gap-1.5">
              <Baby className="w-3.5 h-3.5" />
              Infantil (20)
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Floating Active Tool Palette */}
      {!readonly && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border">
          <span className="text-xs font-semibold text-muted-foreground mr-2">Herramienta Activa:</span>
          {(Object.keys(STATE_CONFIG) as ToothState[]).map((state) => {
            const Icon = STATE_CONFIG[state].icon;
            const isActive = activeTool === state;
            return (
              <Button
                key={state}
                type="button"
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "h-8 text-xs gap-1.5 transition-all",
                  isActive && "ring-2 ring-offset-1 shadow-sm",
                  !isActive && STATE_CONFIG[state].color
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

      {/* Dental Arch Layout */}
      <div className="space-y-8 py-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
        {/* Upper Maxillary Arch */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-4 uppercase tracking-wider px-2">
            <span>Cuadrante 1 (Derecha)</span>
            <span className="text-sm font-semibold text-foreground bg-background px-3 py-1 rounded-full shadow-xs border">
              Maxilar Superior
            </span>
            <span>Cuadrante 2 (Izquierda)</span>
          </div>

          <div className="flex justify-center gap-1 sm:gap-3 flex-wrap">
            <div className="flex gap-1 border-r-2 border-dashed border-slate-300 dark:border-slate-700 pr-2">
              {upperRight.map((num) => <ToothSVG key={num} num={num} />)}
            </div>
            <div className="flex gap-1 pl-2">
              {upperLeft.map((num) => <ToothSVG key={num} num={num} />)}
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          <span className="absolute bg-card px-4 text-[11px] text-muted-foreground uppercase tracking-widest font-mono">
            Línea Oclusal Media
          </span>
        </div>

        {/* Lower Mandibular Arch */}
        <div>
          <div className="flex justify-center gap-1 sm:gap-3 flex-wrap mb-4">
            <div className="flex gap-1 border-r-2 border-dashed border-slate-300 dark:border-slate-700 pr-2">
              {lowerRight.map((num) => <ToothSVG key={num} num={num} />)}
            </div>
            <div className="flex gap-1 pl-2">
              {lowerLeft.map((num) => <ToothSVG key={num} num={num} />)}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider px-2">
            <span>Cuadrante 4 (Derecha)</span>
            <span className="text-sm font-semibold text-foreground bg-background px-3 py-1 rounded-full shadow-xs border">
              Mandíbula Inferior
            </span>
            <span>Cuadrante 3 (Izquierda)</span>
          </div>
        </div>
      </div>

      {/* Editor Modal for detailed notes & overall tooth state */}
      <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Ficha del Diente N° {selectedTooth}
              {selectedTooth && (
                <Badge variant="outline" className="text-xs">
                  {selectedTooth < 30 ? "Maxilar Superior" : "Mandíbula Inferior"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-5 py-3">
            <div className="grid gap-2">
              <Label className="text-xs font-bold">Estado General del Diente</Label>
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
              <Label htmlFor="notes" className="text-xs font-bold">Notas y Observaciones Clínicas</Label>
              <Textarea
                id="notes"
                placeholder="Escribe detalles del diagnóstico o tratamiento necesario..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setSelectedTooth(null)}>Cancelar</Button>
            <Button onClick={handleSaveModal}>Guardar en Historial</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
