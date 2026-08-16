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

    await html2pdf().set(opt).from(element).save();
    toast.success("Documento PDF descargado correctamente 📄", { id: toastId });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    toast.error("Error al descargar. Puedes pulsar Imprimir para guardar en PDF.", { id: toastId });
  }
}
