// src/components/Informes.tsx
import { useState } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export default function Informes({ casos, mes }: { casos: any[], mes: string }) {
  const [generando, setGenerando] = useState(false);
  const mensuales = casos.filter(c => c.fecha.startsWith(mes));

  const generarInformePDF = async () => {
    setGenerando(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = 750;

      // Título
      page.drawText('INFORME ESTADÍSTICO MENSUAL', { x: 50, y, size: 20, font: fontBold, color: rgb(0.1, 0.3, 0.2) });
      y -= 30;
      
      page.drawText(`Red Nacional de Migrantes y Promigrantes`, { x: 50, y, size: 12, font });
      y -= 20;
      
      page.drawText(`Período: ${mes}`, { x: 50, y, size: 12, font: fontBold });
      y -= 40;

      // Resumen general
      const total = mensuales.length;
      page.drawText(`Total de casos registrados: ${total > 0 && total < 5 ? 'Agrupado (<5)' : total}`, { x: 50, y, size: 14, font: fontBold });
      y -= 30;

      // Categorías
      page.drawText('Desglose por Categoría:', { x: 50, y, size: 14, font: fontBold });
      y -= 20;
      
      const categorias = ['Trámite migratorio', 'Vulneración de derechos', 'Derivación', 'Orientación', 'Otro'];
      categorias.forEach(cat => {
        const cant = mensuales.filter(c => c.categoria === cat).length;
        const mostrar = cant > 0 && cant < 5 ? 'Agrupado (<5)' : cant;
        page.drawText(`- ${cat}: ${mostrar}`, { x: 60, y, size: 12, font });
        y -= 20;
      });

      y -= 20;

      // Regiones
      page.drawText('Desglose por Región:', { x: 50, y, size: 14, font: fontBold });
      y -= 20;

      const regiones = Array.from(new Set(mensuales.map(c => c.region)));
      if (regiones.length === 0) {
        page.drawText('- No hay datos para este período.', { x: 60, y, size: 12, font });
      } else {
        regiones.forEach(reg => {
          const cant = mensuales.filter(c => c.region === reg).length;
          const mostrar = cant > 0 && cant < 5 ? 'Agrupado (<5)' : cant;
          page.drawText(`- ${reg}: ${mostrar}`, { x: 60, y, size: 12, font });
          y -= 20;
        });
      }

      // Nota de confidencialidad
      page.drawText('NOTA DE CONFIDENCIALIDAD (Ley 21.719):', { x: 50, y: 150, size: 10, font: fontBold, color: rgb(0.8, 0.1, 0.1) });
      page.drawText('Este informe aplica reglas de K-Anonimato (k=5) para proteger la identidad', { x: 50, y: 135, size: 10, font });
      page.drawText('de las personas migrantes. Los valores menores a 5 se muestran como agrupados.', { x: 50, y: 120, size: 10, font });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Informe_Estadistico_${mes}.pdf`;
      link.click();
    } catch (error) {
      console.error(error);
      alert("Error al generar el informe.");
    } finally {
      setGenerando(false);
    }
  };

  return (
    <section className="panel">
      <h2>Informes para Incidencia Política</h2>
      <p>Genera documentos PDF oficiales con los datos estadísticos del período, listos para presentar a tomadores de decisiones.</p>
      
      <div style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Reporte del período: {mes}</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          El documento exportado incluirá las métricas de casos atendidos, desglosadas por categoría y región. 
          Aquellos valores menores a 5 serán agrupados automáticamente para resguardar la identidad.
        </p>
        <button 
          onClick={generarInformePDF}
          disabled={generando}
          className="boton-primario" 
          style={{ backgroundColor: '#1e40af' }}>
          {generando ? 'Generando PDF...' : '📊 Descargar Informe Estadístico (PDF)'}
        </button>
      </div>
    </section>
  );
}
