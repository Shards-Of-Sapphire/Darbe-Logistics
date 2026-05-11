import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export interface PDFOptions {
  fileName: string;
  toastId?: string;
  onBeforeCapture?: () => void;
  onAfterCapture?: () => void;
}

/**
 * Ultimate Document Service
 * Features:
 * 1. State Fidelity: Captures the LIVE element instead of a potentially stale clone.
 * 2. Auto-Normalization: Forces document-friendly styles (A4 width, no shadows, static positioning).
 * 3. Deep Sync: Ensures all input values are reflected in the PDF.
 * 4. Clipping Prevention: Manual scroll-to-top and explicit dimension calculation.
 */
export const documentService = {
  async downloadPDF(element: HTMLElement, options: PDFOptions) {
    const toastId = options.toastId || toast.loading('Calculating document dimensions...', { id: 'pdf-gen' });
    
    // Save current scroll position to restore later
    const scrollY = window.scrollY;

    try {
      if (options.onBeforeCapture) options.onBeforeCapture();
      
      // Essential: html2canvas captures based on current viewport. 
      // Scrolling to top prevents many clipping and blank-space issues.
      window.scrollTo(0, 0);
      
      // Delay to allow transitions to end and layouts to settle
      await new Promise(resolve => setTimeout(resolve, 600));

      const canvas = await html2canvas(element, {
        scale: 3, // High DPI for small logistics text
        useCORS: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        onclone: (clonedDoc, clonedEl) => {
          // Normalize the cloned element for document export
          clonedEl.style.display = 'block';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.position = 'relative';
          clonedEl.style.margin = '0';
          clonedEl.style.padding = '15mm'; // Standard inner padding
          clonedEl.style.border = 'none';
          clonedEl.style.boxShadow = 'none';
          clonedEl.style.width = '210mm';
          clonedEl.style.maxWidth = 'none';
          clonedEl.style.height = 'auto';

          // Robust color normalization (oklch etc fallback)
          const elements = clonedEl.querySelectorAll('*');
          elements.forEach(node => {
            const el = node as HTMLElement;
            const style = window.getComputedStyle(el);
            
            // Fix modern colors that html2canvas can't parse
            ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
              const val = (style as any)[prop];
              if (val && (val.includes('oklch') || val.includes('oklab'))) {
                el.style[prop as any] = prop === 'color' ? '#111827' : 'transparent';
              }
            });

            // Prevent clipping from sticky or fixed elements
            if (style.position === 'sticky' || style.position === 'fixed') {
              el.style.position = 'static';
            }
          });

          // Sync input values (crucial if user typed recently)
          const inputs = element.querySelectorAll('input, textarea, select');
          const clonedInputs = clonedEl.querySelectorAll('input, textarea, select');
          inputs.forEach((input, i) => {
            if (clonedInputs[i]) {
                (clonedInputs[i] as any).value = (input as any).value;
            }
          });
        }
      });

      // Restore scroll
      window.scrollTo(0, scrollY);
      if (options.onAfterCapture) options.onAfterCapture();

      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pdfWidth = 210;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Handle custom length for long logistic forms
      pdf.addPage([pdfWidth, Math.max(297, pdfHeight)], 'p');
      pdf.setPage(2);
      pdf.deletePage(1); // Default clean page 
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(options.fileName.endsWith('.pdf') ? options.fileName : `${options.fileName}.pdf`);

      toast.success('Professional document exported!', { id: toastId });
    } catch (error) {
      console.error('Critical Document Failure:', error);
      window.scrollTo(0, scrollY);
      toast.error('Automated export interrupted. Fallback to Print View...', { id: toastId });
      
      if (options.onAfterCapture) options.onAfterCapture();
      setTimeout(() => window.print(), 500);
    }
  },

  printDocument(element: HTMLElement, onBefore?: () => void, onAfter?: () => void) {
    if (onBefore) onBefore();
    
    // Simple but effective: trigger browser print
    // The @media print CSS in index.css should handle hiding the UI
    setTimeout(() => {
      window.print();
      if (onAfter) onAfter();
    }, 500);
  }
};
