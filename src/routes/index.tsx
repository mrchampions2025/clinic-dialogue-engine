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
  ChevronDown, 
  Stethoscope, 
  Clock, 
  Zap,
  Check,
  TrendingUp,
  Monitor,
  HeartHandshake,
  Workflow
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DentalFlow AI · Software de Gestión para Clínicas Dentales en la Nube" },
      {
        name: "description",
        content:
          "Software de gestión dental completo en la nube. Administre citas, historias clínicas, facturación Veri*Factu (RD 1007/2023), recepción IA por WhatsApp y firma digital.",
      },
      { property: "og:title", content: "DentalFlow AI · Software de Gestión Dental" },
      {
        property: "og:description",
        content: "Optimice su clínica dental: gestión de pacientes, facturación SIF Veri*Factu, recepción IA y firma digital en un solo lugar.",
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
                Software para Clínicas Dentales
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#por-que-nosotros" className="hover:text-blue-400 transition-colors">¿Por qué elegirnos?</a>
            <a href="#servicios" className="hover:text-blue-400 transition-colors">Módulos & Servicios</a>
            <a href="#pasos" className="hover:text-blue-400 transition-colors">Cómo Funciona</a>
            <a href="#precios" className="hover:text-blue-400 transition-colors">Planes & Tarifas</a>
            <a href="#faq" className="hover:text-blue-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900">
              <Link to="/auth">Iniciar sesión</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-600/25">
              <Link to="/auth" hash="register">
                Solicitar Registro <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="mx-auto max-w-7xl px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur-md mb-6 shadow-inner">
            <ShieldCheck className="size-4 text-emerald-400" />
            Software en la nube 100% Preparado para Veri*Factu (RD 1007/2023)
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.15]">
            Software para Clínicas Dentales <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Gestión Integral en la Nube
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Administre sus citas, tratamientos, facturación, pacientes e historias clínicas desde cualquier dispositivo, con acceso disponible las 24 horas del día, los 7 días de la semana, y con la seguridad plenamente garantizada.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="w-full sm:w-auto text-base h-13 px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold shadow-xl shadow-blue-600/30 rounded-xl">
              <Link to="/auth" hash="register">
                Probar Demo Gratuita <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto text-base h-13 px-8 border-slate-700 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl backdrop-blur-md">
              <Link to="/admin">
                Acceso al Panel SaaS <Building2 className="ml-2 size-5 text-blue-400" />
              </Link>
            </Button>
          </div>

          {/* 3 PILARES CLINIWIN-STYLE */}
          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-5xl mx-auto">
            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <Zap className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Gestión sin estrés</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Organice sus citas, tratamientos y pagos de manera sencilla y eficiente en un solo lugar.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <Monitor className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Tecnología de vanguardia</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Acceda a herramientas modernas con IA, siempre actualizadas para optimizar su labor diaria.
                </p>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-start gap-4">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <HeartHandshake className="size-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Soporte profesional</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Cuente con un acompañamiento experto y personalizado adaptado a las necesidades de su clínica.
                </p>
              </div>
            </div>
          </div>

          {/* DASHBOARD PREVIEW MOCKUP */}
          <div className="mt-14 relative mx-auto max-w-5xl rounded-3xl border border-slate-800 bg-slate-900/90 p-3 sm:p-4 shadow-2xl shadow-blue-950/50 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-3">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-400 font-mono ml-2">app.dentalflow.ai/panel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Veri*Factu RD 1007/2023 Activo
                </span>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Agenda & Recepción IA</span>
                  <MessageCircle className="size-4 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">124 Citas este mes</p>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3" /> Recordatorios por WhatsApp activos
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Facturación SIF (Hash SHA-256)</span>
                  <Receipt className="size-4 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">48.250 €</p>
                <p className="text-[11px] text-purple-300 mt-1 flex items-center gap-1">
                  <ShieldCheck className="size-3" /> Encadenamiento QR oficial
                </p>
              </div>

              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Firma Digital Certificada</span>
                  <Key className="size-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white mt-2">Certificado AEAT / FNMT</p>
                <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Estampado de fecha y hora exacta
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: ¿POR QUÉ ELEGIR DENTALFLOW AI? (INSPIRADO EN CLINIWIN) */}
      <section id="por-que-nosotros" className="py-20 border-t border-slate-800/80 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Gestione Todo Desde Un Solo Lugar</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              ¿Por qué elegir DentalFlow AI como el software para su clínica dental?
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900/60 border border-slate-800 p-7 rounded-2xl hover:border-blue-500/40 transition-colors">
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Building2 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Todo en uno</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gestione citas, caja, cobros, historias clínicas, recepción por WhatsApp y presupuestos, todo desde una única plataforma centralizada.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-7 rounded-2xl hover:border-indigo-500/40 transition-colors">
              <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Monitor className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multiplataforma y siempre accesible</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acceda desde cualquier dispositivo (ordenador, tablet o móvil), con copias de seguridad automáticas y disponibilidad permanente 24/7.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-7 rounded-2xl hover:border-purple-500/40 transition-colors">
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <MessageCircle className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Comunicación efectiva</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Envíe recordatorios por WhatsApp, SMS o email; firme documentos de manera digital y realice envíos de informes con cifrado seguro.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-7 rounded-2xl hover:border-emerald-500/40 transition-colors">
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Receipt className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Datos económicos & Veri*Factu</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Obtenga estadísticas en tiempo real, controle deudas e ingresos y asegure el 100% de cumplimiento fiscal con el Reglamento SIF (RD 1007/2023).
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-7 rounded-2xl hover:border-amber-500/40 transition-colors">
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <Key className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Firma Digital Certificada</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Estampe digitalmente presupuestos con certificados oficiales AEAT / FNMT o sello gráfico de clínica ampliado al 100% con registro temporal.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-7 rounded-2xl hover:border-blue-500/40 transition-colors">
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Zap className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Actualizaciones constantes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Avanzamos junto a nuestras clínicas, incorporando sugerencias y aplicando mejoras continuas sin costes de mantenimiento.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: EL SOFTWARE DE GESTIÓN DENTAL MÁS COMPLETO (INSPIRADO EN CLINIWIN SERVICES) */}
      <section id="servicios" className="py-24 relative">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Módulos Integrados</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              El software de gestión dental más completo
            </p>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed">
              En DentalFlow AI reunimos todas las herramientas que su clínica dental necesita en un solo lugar. Desde la gestión de pacientes hasta el control de ingresos y la comunicación con sus clientes, todo ha sido diseñado para que trabaje de manera más ágil, con menor esfuerzo y con resultados superiores.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Servicio 1 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Stethoscope className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Gestión de pacientes e Historias Clínicas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Organice su agenda y ficha clínica de manera integral. Registre historiales, tratamientos, consentimientos, presupuestos y documentos firmados, todo vinculado a la cita del paciente y disponible en cualquier momento.
              </p>
            </div>

            {/* Servicio 2 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-purple-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Receipt className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Administración y Facturación SIF (Veri*Factu)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mantenga un control total de su clínica. Gestione la caja diaria, deudas, cobros y facturas oficiales compatibles con el Reglamento SIF (RD 1007/2023), con huella SHA-256 y código QR oficial.
              </p>
            </div>

            {/* Servicio 3 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Comunicación & Recepción IA 24/7</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permanezca siempre conectado con sus pacientes. Recepcionista IA por WhatsApp que resuelve dudas y agenda citas con control dinámico de límite diario para evitar sobrecargas en recepción.
              </p>
            </div>

            {/* Servicio 4 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Key className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Firma Digital & Certificados Electrónicos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Valide presupuestos con firma electrónica avanzada. Cargue su certificado oficial AEAT/FNMT o utilice el sello oficial de su clínica ampliado para máximas garantías legales.
              </p>
            </div>

            {/* Servicio 5 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-amber-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Presupuestos Interactivos para Pacientes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Portal del paciente adaptado que organiza automáticamente los tratamientos mostrando primero los <strong>Pendientes por fecha</strong> para agilizar la aceptación y el inicio del tratamiento.
              </p>
            </div>

            {/* Servicio 6 */}
            <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/50 transition-all group">
              <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <CalendarCheck className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Agenda Médica Visual e Inteligente</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calendario dinámico con clasificación clara de estados (Confirmadas en verde, Pendientes en naranja, Canceladas en rojo), permitiendo a recepción controlar el día de un solo vistazo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: 4 PASOS PARA OPTIMIZAR SU CLÍNICA (ESTILO CLINIWIN) */}
      <section id="pasos" className="py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Flujo de Trabajo Eficiente</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              4 pasos para optimizar su clínica con DentalFlow AI
            </p>
            <p className="mt-4 text-slate-400 text-sm">
              Desde la primera consulta hasta la facturación final, todo se organiza en un solo lugar para ahorrar tiempo y ofrecer una atención excelente.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Paso 1 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative">
              <span className="text-3xl font-extrabold text-blue-500/40 font-mono absolute top-4 right-4">01</span>
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <CalendarCheck className="size-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Agende su cita</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reserve y confirme citas con recordatorios automáticos por WhatsApp, SMS o correo electrónico.
              </p>
            </div>

            {/* Paso 2 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative">
              <span className="text-3xl font-extrabold text-blue-500/40 font-mono absolute top-4 right-4">02</span>
              <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Stethoscope className="size-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Reciba al paciente</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Acceda de inmediato a su ficha clínica completa, con tratamientos anteriores y presupuestos activos.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative">
              <span className="text-3xl font-extrabold text-blue-500/40 font-mono absolute top-4 right-4">03</span>
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <FileText className="size-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Solucione sus necesidades</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registre diagnósticos y genere presupuestos interactivos directamente desde el sistema.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl relative">
              <span className="text-3xl font-extrabold text-blue-500/40 font-mono absolute top-4 right-4">04</span>
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Receipt className="size-5" />
              </div>
              <h3 className="font-bold text-white text-base mb-2">Realice el tratamiento</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Actualice la ficha del paciente, aplique la firma digital y genere la facturación SIF al instante.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING / PLANES SAAS */}
      <section id="precios" className="py-24 border-t border-slate-800/80">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Planes a Tu Medida</h2>
            <p className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Suscripciones transparentes sin permanencia
            </p>
            <p className="mt-4 text-slate-400 text-sm">
              Elige el plan ideal para tu clínica dental y escala a medida que crecen tus gabinetes y pacientes.
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
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Recepción IA por WhatsApp</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Facturación SIF Veri*Factu RD 1007</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Límite de 10 citas automáticas/día</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="mt-8 w-full border-slate-700 hover:bg-slate-800 text-white">
                <Link to="/auth" hash="register">Probar Demo Gratis</Link>
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
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Recepción IA Ilimitada</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Firma Digital Certificada AEAT/FNMT</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Sello Oficial de Clínica (+100% ampliado)</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-emerald-400" /> Facturación Veri*Factu con QR & SHA-256</li>
                </ul>
              </div>
              <Button asChild className="mt-8 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-lg">
                <Link to="/auth" hash="register">Empezar Ahora</Link>
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
      <section id="faq" className="py-24 bg-slate-900/30">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center">
            <h2 className="text-xs font-semibold text-blue-400 tracking-widest uppercase">Resuelve tus dudas</h2>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white">Preguntas Frecuentes sobre DentalFlow AI</p>
          </div>

          <div className="mt-12 space-y-4">
            {[
              {
                q: "¿Cumple DentalFlow AI con el reglamento Veri*Factu (RD 1007/2023)?",
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
            Comience a optimizar su clínica dental hoy mismo
          </h2>
          <p className="text-blue-100 text-sm max-w-2xl mx-auto">
            Únase a más de 250 clínicas dentales que automatizan su recepción por WhatsApp, gestionan historias clínicas en la nube y emiten facturas Veri*Factu 100% legales.
          </p>
          <div>
            <Button asChild size="lg" className="h-14 px-10 text-base bg-white text-blue-900 hover:bg-blue-50 font-extrabold shadow-2xl rounded-xl">
              <Link to="/auth" hash="register">
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
