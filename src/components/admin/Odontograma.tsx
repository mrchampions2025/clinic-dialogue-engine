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

export type ToothState = "Sano" | "Caries" | "Empaste" | "Ausente" | "Implante" | "Endodoncia";

export type ToothRecord = {
  tooth_number: number;
  state: ToothState;
  notes?: string;
};

const TEETH_UPPER = [
  18, 17, 16, 15, 14, 13, 12, 11, // Right
  21, 22, 23, 24, 25, 26, 27, 28, // Left
];

const TEETH_LOWER = [
  48, 47, 46, 45, 44, 43, 42, 41, // Right
  31, 32, 33, 34, 35, 36, 37, 38, // Left
];

const STATE_COLORS: Record<ToothState, string> = {
  Sano: "bg-yellow-400 border-yellow-500 text-yellow-950",
  Caries: "bg-red-500 border-red-600 text-white",
  Empaste: "bg-blue-500 border-blue-600 text-white",
  Ausente: "bg-slate-800 border-slate-900 text-white opacity-50",
  Implante: "bg-purple-500 border-purple-600 text-white",
  Endodoncia: "bg-orange-500 border-orange-600 text-white",
};

interface OdontogramaProps {
  records: Record<number, ToothRecord>;
  onUpdateTooth: (tooth: number, state: ToothState, notes: string) => void;
  readonly?: boolean;
}

export function Odontograma({ records, onUpdateTooth, readonly = false }: OdontogramaProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editState, setEditState] = useState<ToothState>("Sano");
  const [editNotes, setEditNotes] = useState("");

  const handleToothClick = (tooth: number) => {
    if (readonly) return;
    setSelectedTooth(tooth);
    const existing = records[tooth];
    setEditState(existing?.state || "Sano");
    setEditNotes(existing?.notes || "");
  };

  const handleSave = () => {
    if (selectedTooth !== null) {
      onUpdateTooth(selectedTooth, editState, editNotes);
      setSelectedTooth(null);
    }
  };

  const renderTooth = (num: number) => {
    const state = records[num]?.state || "Sano";
    return (
      <button
        key={num}
        onClick={() => handleToothClick(num)}
        className={cn(
          "flex flex-col items-center justify-center p-2 rounded-lg border-2 shadow-sm transition-all hover:scale-105",
          STATE_COLORS[state],
          readonly && "cursor-default hover:scale-100"
        )}
      >
        <span className="text-xs font-bold">{num}</span>
      </button>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-50/50 rounded-2xl border border-border">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Odontograma Adulto</h3>
        <div className="flex gap-3 text-xs flex-wrap">
          {Object.entries(STATE_COLORS).map(([state, colorClass]) => (
            <div key={state} className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded-sm border", colorClass)} />
              <span className="text-muted-foreground">{state}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* Superior */}
        <div>
          <div className="text-center text-sm text-muted-foreground mb-2">Maxilar Superior</div>
          <div className="flex justify-center gap-1 sm:gap-2">
            {TEETH_UPPER.map(renderTooth)}
          </div>
        </div>

        {/* Inferior */}
        <div>
          <div className="text-center text-sm text-muted-foreground mb-2">Mandíbula (Inferior)</div>
          <div className="flex justify-center gap-1 sm:gap-2">
            {TEETH_LOWER.map(renderTooth)}
          </div>
        </div>
      </div>

      {/* Editor Dialog */}
      <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estado de la pieza {selectedTooth}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Estado</Label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATE_COLORS) as ToothState[]).map((state) => (
                  <Button
                    key={state}
                    type="button"
                    variant={editState === state ? "default" : "outline"}
                    className={cn(
                      "transition-all",
                      editState === state && STATE_COLORS[state]
                    )}
                    onClick={() => setEditState(state)}
                  >
                    {state}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas Clínicas</Label>
              <Textarea 
                id="notes" 
                placeholder="Observaciones sobre esta pieza..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedTooth(null)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
