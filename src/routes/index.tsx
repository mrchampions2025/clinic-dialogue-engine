import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { 
  Sparkles, 
  ShieldCheck, 
  CalendarCheck, 
  FileText, 
  Receipt, 
  Key, 
  MessageCircle, 
  Building2, 
  CheckCircle2, 
  ArrowRight, 
  Star, 
  ChevronDown, 
  Stethoscope, 
  Lock, 
  Clock, 
  Zap,
  Check,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DentalFlow AI · Software SaaS para Clínicas Dentales | IA & Veri*Factu" },
      {
        name: "description",
        content:
          "Plataforma SaaS para clínicas dentales: Recepcionista IA por WhatsApp, facturación SIF Veri*Factu (RD 1007/2023), firma digital con certificado AEAT/FNMT y gestión de citas.",
      },
      { property: "og:title", content: "DentalFlow AI · SaaS de Gestión Dental" },
      {
        property: "og:description",
        content: "Automatiza tu clínica dental con IA, facturación SIF Veri*Factu y firma digital con certificado oficial.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: SaaSLandingPage,
});

function SaaSLandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white font-sans">
      {/* HEADER / NAVIGATION BAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              DF
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                DentalFlow <span className="text-blue-500">AI</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block -mt-1">
                SaaS Dental Management
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#caracteristicas" className="hover:text-blue-400 transition-colors">Características</a>
            <a href="#soluciones" className="hover:text-blue-400 transition-colors">Soluciones SIF</a>
            <a href="#precios" className="hover:text-blue-400 transition-colors">Planes & Precios</a>
            <a href="#testimonios" className="hover:text-blue-400 transition-colors">Testimonios</a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900">
              <Link to="/auth">Iniciar sesión</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/25">
              <Link to="/auth">
                Crear cuenta <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur-md mb-8 shadow-inner">
            <Sparkles className="size-3.5 text-blue-400 animate-pulse" />
            Software SaaS para Clínicas Dentales de Nueva Generación
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
            El Software SaaS Dental que <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Automatiza tu Clínica con IA
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Gestión completa en la nube: Recepcionista IA 24/7 por WhatsApp, facturación SIF Veri*Factu (RD 1007/2023), firma digital con certificado oficial AEAT/FNMT y agenda médica inteligente.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-base h-13 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold shadow-xl shadow-blue-600/30 rounded-xl">
              <Link to="/auth">
                Probar Gratis 14 Días <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base h-13 px-8 border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl backdrop-blur-md">
              <Link to="/panel">
                Ver Demo en Vivo <Building2 className="ml-2 size-5 text-blue-400" />
              </Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-400" /> Sin tarjeta de crédito</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-400" /> Configuración en 30 segundos</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="size-4 text-emerald-400" /> Cumplimiento Veri*Factu</span>
          </div>

          {/* DASHBOARD PREVIEW MOCKUP */}
          <div className="mt-16 relative mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-2xl shadow-blue-950/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">app.dentalflow.ai/panel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Veri*Factu RD 1007/2023 OK
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Recepción IA WhatsApp</span>
                  <MessageCircle className="size-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">124 Citas / mes</p>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3" /> +38% auto-confirmadas (Máx 10/día)
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Facturación SIF Sello SHA-256</span>
                  <Receipt className="size-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">48.250 €</p>
                <p className="text-[11px] text-purple-300 mt-1 flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Encadenamiento QR activo
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Firma Digital Certificada</span>
                  <Key className="size-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">Certificado AEAT</p>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> X.509 Valido hasta 2029
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS & LOGOS */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 py-10">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">+250</p>
            <p className="text-xs text-slate-400 mt-1">Clínicas dentales activas en España</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-blue-400 tracking-tight">100%</p>
            <p className="text-xs text-slate-400 mt-1">Cumplimiento Reglamento SIF RD 1007/2023</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-indigo-400 tracking-tight">24/7</p>
            <p className="text-xs text-slate-400 mt-1">Atención automatizada por WhatsApp IA</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-purple-400 tracking-tight">99.9%</p>
            <p className="text-xs text-slate-400 mt-1">Disponibilidad en la nube de alta seguridad</p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="caracteristicas" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Módulos SaaS Integrados</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Todo lo que tu Clínica Dental necesita en un solo software
            </p>
            <p className="mt-4 text-slate-400 text-base">
              Diseñado específicamente para optimizar la gestión de consultas odontológicas, recepción y facturación fiscal.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">IA de Recepción & Citas por WhatsApp</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Responde preguntas sobre tratamientos de ortodoncia, limpiezas e implantes. Permite configurar el <strong>límite de citas automáticas diarias</strong> (ej. 10/día) para no sobrecargar la agenda.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-purple-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Facturación SIF Veri*Factu (RD 1007/2023)</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Genera facturas oficiales con código QR cotejable con la Agencia Tributaria, firma de registros con hash SHA-256 e impresiones PDF para tus pacientes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Key className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Firma Digital con Certificado AEAT / FNMT</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Sube tu certificado electrónico oficial (.p12 / .pfx) de la Casa de la Moneda o utiliza un sello gráfico de clínica ampliado al 100% con estampado de fecha y hora exacta.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Presupuestos Interactivos para Pacientes</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                El portal del paciente organiza automáticamente los tratamientos mostrando primero los <strong>Pendientes por fecha</strong> para agilizar la aceptación y firma.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-amber-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarCheck className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Agenda de Citas Visual & Dinámica</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Calendario estilizado e interactivo codificado por colores (Confirmada, Pendiente, Cancelada) para que recepción visualice el día de un vistazo.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Building2 className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Auto-Configuración SaaS Instantánea</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                En el primer acceso de cada cliente, el sistema auto-crea la configuración de empresa por defecto con datos fiscales listos para usar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING / PLANES SAAS */}
      <section id="precios" className="py-24 bg-slate-900/40 border-t border-slate-800/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Planes SaaS a Tu Medida</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Precios transparentes sin permanencia
            </p>
            <p className="mt-4 text-slate-400 text-base">
              Elige el plan ideal para tu clínica dental y escala a medida que crecen tus pacientes.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Plan 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Plan Clínica Starter</h3>
                <p className="text-xs text-slate-400 mt-1">Para consultas dentales independientes</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">49 €</span>
                  <span className="text-xs text-slate-400 ml-1">/ mes + IVA</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Hasta 1 Gabinete de atención</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Recepcionista IA por WhatsApp</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Facturación SIF Veri*Factu RD 1007</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Límite de 10 citas automáticas/día</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="mt-8 w-full border-slate-700 hover:bg-slate-800 text-white">
                <Link to="/auth">Probar 14 Días Gratis</Link>
              </Button>
            </div>

            {/* Plan 2 - Featured */}
            <div className="bg-gradient-to-b from-blue-900/50 via-indigo-950/50 to-slate-900 border-2 border-blue-500 rounded-3xl p-8 flex flex-col justify-between relative shadow-2xl shadow-blue-600/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md">
                Más Popular · Recomendado
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Plan Pro Clínica</h3>
                <p className="text-xs text-blue-200 mt-1">Para clínicas con equipo y varios doctores</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">89 €</span>
                  <span className="text-xs text-slate-300 ml-1">/ mes + IVA</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Hasta 5 Gabinetes dentales</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Recepcionista IA Ilimitada</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Firma Digital Certificada X.509 AEAT/FNMT</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Sello Oficial de Clínica (+100% ampliado)</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Facturación Veri*Factu con QR & SHA-256</li>
                </ul>
              </div>
              <Button asChild className="mt-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg">
                <Link to="/auth">Empezar Ahora</Link>
              </Button>
            </div>

            {/* Plan 3 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Plan Red de Clínicas</h3>
                <p className="text-xs text-slate-400 mt-1">Franquicias y grupos dentales multi-centro</p>
                <div className="mt-6 flex items-baseline">
                  <span className="text-4xl font-extrabold text-white">169 €</span>
                  <span className="text-xs text-slate-400 ml-1">/ mes + IVA</span>
                </div>
                <ul className="mt-8 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Gabinetes e instalaciones ilimitadas</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Múltiples Certificados Digitales por sede</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Soporte telefónico prioritario 24/7</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Migración de datos sin coste</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="mt-8 w-full border-slate-700 hover:bg-slate-800 text-white">
                <Link to="/auth">Contactar Ventas</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-24">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Resuelve tus dudas</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">Preguntas Frecuentes sobre DentalFlow SaaS</p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              {
                q: "¿Cumple DentalFlow con el reglamento Veri*Factu (RD 1007/2023)?",
                a: "Sí. DentalFlow genera registros de facturación no modificables con huella criptográfica SHA-256 encadenada y código QR oficial de la Agencia Tributaria Española.",
              },
              {
                q: "¿Cómo funciona el auto-creado de la configuración de empresa?",
                a: "En tu primer acceso tras registrarte en la plataforma, el sistema genera automáticamente tu ficha de empresa con los parámetros por defecto para que puedas emitir facturas y presupuestos de inmediato.",
              },
              {
                q: "¿Puedo usar mi propio Certificado Electrónico de la AEAT o FNMT?",
                a: "Totalmente. Puedes cargar tu certificado (.p12 / .pfx / .cer) en el panel de configuración para estampación digital con sello de tiempo oficial en todos los presupuestos.",
              },
              {
                q: "¿Cómo controla la IA las citas automáticas diarias?",
                a: "En la configuración puedes definir el límite de citas (por defecto 10). Las primeras citas del día se confirman automáticamente en el calendario visual y las siguientes pasan a estado Pendiente para revisión manual.",
              },
            ].map((faq, idx) => (
              <div key={idx} className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full text-left p-6 flex justify-between items-center text-white font-semibold text-sm hover:text-blue-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`size-5 text-slate-400 transition-transform ${openFaq === idx ? "rotate-180 text-blue-400" : ""}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-6 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-6 text-center relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Comienza a transformar tu clínica dental hoy mismo
          </h2>
          <p className="text-blue-100 text-base max-w-2xl mx-auto">
            Únete a más de 250 clínicas dentales que automatizan su recepción con IA y emiten facturas Veri*Factu 100% legales.
          </p>
          <div>
            <Button asChild size="lg" className="h-14 px-10 text-base bg-white text-blue-900 hover:bg-blue-50 font-extrabold shadow-2xl rounded-xl">
              <Link to="/auth">
                Crear Mi Cuenta Gratis <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
              DF
            </div>
            <span className="font-bold text-white text-sm">DentalFlow AI SaaS</span>
          </div>
          <p>© {new Date().getFullYear()} DentalFlow Engine S.L. Todos los derechos reservados. RD 1007/2023 Compliant.</p>
          <div className="flex gap-4">
            <Link to="/auth" className="hover:text-white">Acceso Clínica</Link>
            <Link to="/panel" className="hover:text-white">Panel SaaS</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
