import { Budget, computeTotals, formatMoney, isExpired } from "@/lib/budgets";
import { formatDate } from "@/lib/clinic-data";
import { cn } from "@/lib/utils";
import { CalendarClock, ShieldCheck } from "lucide-react";

export function BudgetEstadoBadge({ budget }: { budget: Budget }) {
  const expired = isExpired(budget);
  const label = expired ? "Caducado" : budget.estado;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
        label === "Aceptado" && "bg-accent text-accent-foreground",
        label === "Rechazado" && "bg-destructive/10 text-destructive",
        label === "Pendiente" && "bg-primary/10 text-primary",
        label === "Borrador" && "bg-muted text-muted-foreground",
        label === "Caducado" && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function BudgetDocument({ budget }: { budget: Budget }) {
  const items = budget.budget_items || [];
  const totals = computeTotals(items, budget.descuento);

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex flex-col gap-4 border-b border-border bg-muted/40 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Clínica Dental Dentix</p>
          <h3 className="mt-1 text-xl font-semibold tracking-tight">{budget.titulo}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nº {budget.numero || "—"} · Emitido el {formatDate(budget.fecha)}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <BudgetEstadoBadge budget={budget} />
          {budget.valido_hasta && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarClock className="size-3.5" /> Válido hasta {formatDate(budget.valido_hasta)}
            </p>
          )}
        </div>
      </header>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-medium">Tratamiento</th>
                <th className="pb-2 text-center font-medium">Cant.</th>
                <th className="pb-2 text-right font-medium">Precio</th>
                <th className="pb-2 text-right font-medium">Dto.</th>
                <th className="pb-2 text-right font-medium">Importe</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Sin líneas de tratamiento.
                  </td>
                </tr>
              )}
              {items.map((it, idx) => (
                <tr key={it.id || idx} className="border-b border-border/60 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{it.tratamiento}</p>
                    {it.descripcion && <p className="text-xs text-muted-foreground">{it.descripcion}</p>}
                  </td>
                  <td className="py-3 text-center tabular-nums">{it.cantidad}</td>
                  <td className="py-3 text-right tabular-nums">{formatMoney(it.precio)}</td>
                  <td className="py-3 text-right tabular-nums text-muted-foreground">
                    {Number(it.descuento) > 0 ? `-${formatMoney(it.descuento)}` : "—"}
                  </td>
                  <td className="py-3 text-right font-medium tabular-nums">
                    {formatMoney(it.cantidad * it.precio - (Number(it.descuento) || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
            </div>
            {totals.descuento > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <dt>Descuentos</dt>
                <dd className="tabular-nums">-{formatMoney(totals.descuento)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between border-t border-border pt-2">
              <dt className="font-medium">Total</dt>
              <dd className="text-2xl font-semibold tabular-nums text-primary">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
        </div>

        {budget.notas && (
          <div className="mt-6 rounded-xl bg-muted/50 p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notas</p>
            <p className="text-sm">{budget.notas}</p>
          </div>
        )}

        {budget.condiciones && (
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{budget.condiciones}</p>
        )}

        {budget.estado === "Aceptado" && budget.firma_data && (
          <div className="mt-6 flex flex-col gap-4 rounded-xl border border-accent/40 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-accent-foreground">
                <ShieldCheck className="size-4" /> Presupuesto aceptado y firmado
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {budget.firma_nombre}
                {budget.firma_dni ? ` · ${budget.firma_dni}` : ""}
                {budget.firmado_at
                  ? ` · ${new Date(budget.firmado_at).toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}`
                  : ""}
              </p>
            </div>
            <img
              src={budget.firma_data}
              alt={`Firma de ${budget.firma_nombre ?? "el paciente"}`}
              className="h-20 w-48 rounded-lg bg-card object-contain p-1"
            />
          </div>
        )}
      </div>
    </article>
  );
}
