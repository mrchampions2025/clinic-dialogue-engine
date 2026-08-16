import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export async function downloadElementAsPdf(elementId: string, filename: string) {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    toast.error("No se ha encontrado el documento para exportar.");
    return;
  }

  const toastId = toast.loading("Generando y descargando PDF oficial...");

  // Contenedor temporal aislado fuera de pantalla para que html2canvas no sufra por CSS transform o zoom
  let cloneContainer: HTMLDivElement | null = null;

  try {
    // 1. Clonar el elemento de la factura / presupuesto
    const clone = targetElement.cloneNode(true) as HTMLElement;

    // Resetear transformaciones de zoom, márgenes y sombras que arruinan la captura en canvas
    clone.style.transform = "none";
    clone.style.transformOrigin = "initial";
    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    clone.style.width = "210mm";
    clone.style.maxWidth = "210mm";
    clone.style.minHeight = "297mm";
    clone.style.position = "static";

    // 2. Crear contenedor temporal fuera del flujo visual
    cloneContainer = document.createElement("div");
    cloneContainer.style.position = "absolute";
    cloneContainer.style.left = "-9999px";
    cloneContainer.style.top = "0px";
    cloneContainer.style.width = "210mm";
    cloneContainer.style.background = "#ffffff";
    cloneContainer.style.zIndex = "-9999";
    cloneContainer.appendChild(clone);

    document.body.appendChild(cloneContainer);

    // 3. Renderizar imagen canvas limpia con html2canvas
    const canvas = await html2canvas(clone, {
      scale: 2, // Alta definición HD
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // 4. Crear documento PDF A4 con jsPDF
    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

    // Si el contenido requiere varias páginas, agregarlas automáticamente
    let heightLeft = pdfHeight - pdf.internal.pageSize.getHeight();
    let position = -pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      position -= pdf.internal.pageSize.getHeight();
    }

    const finalName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    pdf.save(finalName);

    toast.success("Documento PDF descargado correctamente 📄", { id: toastId });
  } catch (error) {
    console.error("Error al generar PDF:", error);
    toast.error("Hubo un problema al generar la descarga. Se usará el visor de impresión.", { id: toastId });
    // Fallback limpio a impresión nativa si la exportación estricta fallara
    window.print();
  } finally {
    // SIEMPRE eliminar el contenedor de clonación sin importar si hubo éxito o error
    if (cloneContainer && document.body.contains(cloneContainer)) {
      document.body.removeChild(cloneContainer);
    }
  }
}
