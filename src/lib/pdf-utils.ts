import { toast } from "sonner";
import html2pdf from "html2pdf.js";

export async function downloadElementAsPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) {
    toast.error("No se ha encontrado el documento para exportar.");
    return;
  }

  const toastId = toast.loading("Generando documento PDF para descarga...");

  try {
    const opt = {
      margin: [4, 4, 4, 4],
      filename: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    // Dependiendo de cómo Vite importe html2pdf.js, puede ser el default o el módulo entero
    const generatePdf = (html2pdf as any).default || html2pdf;
    await generatePdf().set(opt).from(element).save();
    toast.success("Documento PDF descargado correctamente 📄", { id: toastId });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    
    // Limpiar cualquier contenedor de html2canvas que se haya quedado colgado y bloquee la UI
    document.querySelectorAll('.html2canvas-container').forEach(e => e.remove());
    document.querySelectorAll('iframe').forEach(iframe => {
      if (iframe.style.position === 'absolute' || iframe.style.position === 'fixed') {
        iframe.remove();
      }
    });

    toast.error("Error al descargar. Puedes pulsar Imprimir para guardar en PDF.", { id: toastId });
  }
}
