export const kpis = [
  { label: "Nuevos pacientes hoy", value: "12", delta: "+18%", hint: "vs. ayer" },
  { label: "Citas programadas", value: "38", delta: "+6%", hint: "esta semana" },
  { label: "Mensajes IA procesados", value: "1.284", delta: "+24%", hint: "últimos 7 días" },
  { label: "Conversión de citas", value: "62%", delta: "+4 pts", hint: "de chat a cita" },
];

export type Estado = "Pendiente" | "Confirmada" | "Cancelada";

export const citasHoy = [
  { hora: "09:00", paciente: "Lucía Herrera", tratamiento: "Limpieza dental", estado: "Confirmada" as Estado },
  { hora: "10:30", paciente: "Marcos Ruiz", tratamiento: "Ortodoncia (revisión)", estado: "Confirmada" as Estado },
  { hora: "11:15", paciente: "Ana Belén Soto", tratamiento: "Implante unitario", estado: "Pendiente" as Estado },
  { hora: "12:45", paciente: "Javier Molina", tratamiento: "Urgencia · dolor muela", estado: "Confirmada" as Estado },
  { hora: "16:00", paciente: "Paula Nieto", tratamiento: "Blanqueamiento", estado: "Pendiente" as Estado },
  { hora: "17:30", paciente: "Diego Cabrera", tratamiento: "Endodoncia", estado: "Cancelada" as Estado },
];

export const citas = [
  { fecha: "06/08/2026", hora: "09:00", paciente: "Lucía Herrera", telefono: "+34 611 223 344", tratamiento: "Limpieza dental", canal: "WhatsApp IA", estado: "Confirmada" as Estado },
  { fecha: "06/08/2026", hora: "11:15", paciente: "Ana Belén Soto", telefono: "+34 622 118 902", tratamiento: "Implante unitario", canal: "WhatsApp IA", estado: "Pendiente" as Estado },
  { fecha: "06/08/2026", hora: "17:30", paciente: "Diego Cabrera", telefono: "+34 655 771 220", tratamiento: "Endodoncia", canal: "Teléfono", estado: "Cancelada" as Estado },
  { fecha: "07/08/2026", hora: "10:00", paciente: "Marcos Ruiz", telefono: "+34 699 004 512", tratamiento: "Ortodoncia (revisión)", canal: "WhatsApp IA", estado: "Confirmada" as Estado },
  { fecha: "07/08/2026", hora: "12:30", paciente: "Paula Nieto", telefono: "+34 634 889 100", tratamiento: "Blanqueamiento", canal: "Web", estado: "Pendiente" as Estado },
  { fecha: "08/08/2026", hora: "09:45", paciente: "Javier Molina", telefono: "+34 677 445 118", tratamiento: "Urgencia dental", canal: "WhatsApp IA", estado: "Confirmada" as Estado },
  { fecha: "08/08/2026", hora: "18:15", paciente: "Elena Vargas", telefono: "+34 688 332 907", tratamiento: "Primera visita", canal: "WhatsApp IA", estado: "Pendiente" as Estado },
];

export const pacientes = [
  { nombre: "Lucía Herrera", telefono: "+34 611 223 344", email: "lucia.h@mail.com", ultimaVisita: "12/07/2026", proxima: "06/08/2026", etiqueta: "Recurrente" },
  { nombre: "Marcos Ruiz", telefono: "+34 699 004 512", email: "marcos.ruiz@mail.com", ultimaVisita: "02/07/2026", proxima: "07/08/2026", etiqueta: "Ortodoncia" },
  { nombre: "Ana Belén Soto", telefono: "+34 622 118 902", email: "abs@mail.com", ultimaVisita: "—", proxima: "06/08/2026", etiqueta: "Nuevo" },
  { nombre: "Javier Molina", telefono: "+34 677 445 118", email: "j.molina@mail.com", ultimaVisita: "28/06/2026", proxima: "08/08/2026", etiqueta: "Urgencias" },
  { nombre: "Paula Nieto", telefono: "+34 634 889 100", email: "paula.nieto@mail.com", ultimaVisita: "19/05/2026", proxima: "07/08/2026", etiqueta: "Estética" },
  { nombre: "Elena Vargas", telefono: "+34 688 332 907", email: "elena.v@mail.com", ultimaVisita: "—", proxima: "08/08/2026", etiqueta: "Nuevo" },
];

export const tratamientos = [
  { nombre: "Limpieza dental (higiene)", categoria: "Prevención", precio: "60 €", duracion: "30 min" },
  { nombre: "Primera visita + revisión", categoria: "Prevención", precio: "Gratis", duracion: "20 min" },
  { nombre: "Empaste composite", categoria: "Conservadora", precio: "75 €", duracion: "45 min" },
  { nombre: "Endodoncia unirradicular", categoria: "Conservadora", precio: "180 €", duracion: "60 min" },
  { nombre: "Implante unitario", categoria: "Implantes", precio: "950 €", duracion: "90 min" },
  { nombre: "Ortodoncia invisible", categoria: "Ortodoncia", precio: "3.200 €", duracion: "45 min" },
  { nombre: "Brackets metálicos", categoria: "Ortodoncia", precio: "2.400 €", duracion: "45 min" },
  { nombre: "Blanqueamiento LED", categoria: "Estética", precio: "290 €", duracion: "60 min" },
];

export type ChatEstado = "Atendido por IA" | "Requiere humano" | "Resuelto";

export const chats = [
  {
    id: "c1",
    nombre: "Lucía Herrera",
    iniciales: "LH",
    ultimo: "Perfecto, nos vemos el jueves a las 9 😊",
    hora: "12:41",
    estado: "Atendido por IA" as ChatEstado,
    mensajes: [
      { from: "patient", text: "Hola, quería pedir cita para una limpieza" },
      { from: "ai", text: "¡Hola Lucía! Soy Marta, de recepción de Dentix 🦷\nTenemos hueco el jueves a las 9:00 o el viernes a las 17:00. ¿Cuál te viene mejor?" },
      { from: "patient", text: "El jueves a las 9 mejor" },
      { from: "ai", text: "Genial, te dejo la cita reservada para el jueves a las 9:00 con la higienista ✅" },
      { from: "patient", text: "Perfecto, nos vemos el jueves a las 9 😊" },
    ],
  },
  {
    id: "c2",
    nombre: "Javier Molina",
    iniciales: "JM",
    ultimo: "Me duele muchísimo desde anoche…",
    hora: "12:20",
    estado: "Requiere humano" as ChatEstado,
    mensajes: [
      { from: "patient", text: "Buenas, tengo un dolor fuerte en una muela" },
      { from: "ai", text: "Siento oír eso, Javier. ¿Es un dolor continuo o solo al masticar?" },
      { from: "patient", text: "Me duele muchísimo desde anoche…" },
    ],
  },
  {
    id: "c3",
    nombre: "Ana Belén Soto",
    iniciales: "AS",
    ultimo: "¿El implante lleva financiación?",
    hora: "11:52",
    estado: "Requiere humano" as ChatEstado,
    mensajes: [
      { from: "patient", text: "Hola, me interesa un implante" },
      { from: "ai", text: "¡Hola Ana! El implante unitario está en 950 €, incluye corona 😊" },
      { from: "patient", text: "¿El implante lleva financiación?" },
    ],
  },
  {
    id: "c4",
    nombre: "Marcos Ruiz",
    iniciales: "MR",
    ultimo: "Gracias, confirmado 👍",
    hora: "10:05",
    estado: "Resuelto" as ChatEstado,
    mensajes: [
      { from: "ai", text: "Hola Marcos, te recuerdo tu revisión de ortodoncia el viernes a las 10:00" },
      { from: "patient", text: "Gracias, confirmado 👍" },
    ],
  },
  {
    id: "c5",
    nombre: "Paula Nieto",
    iniciales: "PN",
    ultimo: "¿Cuánto dura el blanqueamiento?",
    hora: "09:14",
    estado: "Atendido por IA" as ChatEstado,
    mensajes: [
      { from: "patient", text: "¿Cuánto dura el blanqueamiento?" },
      { from: "ai", text: "La sesión dura unos 60 minutos y el resultado se mantiene entre 12 y 18 meses ✨" },
    ],
  },
];
