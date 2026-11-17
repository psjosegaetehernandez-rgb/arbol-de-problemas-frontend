// src/components/caso/CasoDetalle.tsx
import React, { useState } from 'react';
import { cifrarDatos, derivarLlaveDesdeTexto, descifrarDatos } from '../../crypto/e2ee';
import { guardarCasoLocal, db } from '../../db/database';
import { subirCasoANube } from '../../db/nubeSimulada';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import './CasoDetalle.css';

export default function CasoDetalle({ casoId, onVolver }: { casoId: string, onVolver: () => void }) {
  const [tab, setTab] = useState('ficha');
  const [dek, setDek] = useState<CryptoKey | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [textoPlano, setTextoPlano] = useState('');
  const [estadoCaso, setEstadoCaso] = useState('En seguimiento');
  const [docs, setDocs] = useState<{nombre: string, contenido: string, datosCifrados: any}[]>([]);
  const [guardado, setGuardado] = useState(false);
  const [sincronizado, setSincronizado] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const abrirBoveda = async () => {
    if (!tokenInput) return alert("Por favor, ingresa un token.");
    const nuevaDek = await derivarLlaveDesdeTexto(tokenInput);
    
    const casoDb = await db.casos.get(casoId);
    if (casoDb) {
      setEstadoCaso(casoDb.estado || 'En seguimiento');
      
      if (casoDb.datosCifrados) {
        try {
          const descifrado = await descifrarDatos(casoDb.datosCifrados, nuevaDek);
          // Formatear el JSON para que sea legible por humanos
          try {
            const parsed = JSON.parse(descifrado);
            setTextoPlano(JSON.stringify(parsed, null, 2));
          } catch {
            // Si no es JSON (texto antiguo), mostrar tal cual
            setTextoPlano(descifrado);
          }
        } catch (e) {
          return alert("❌ Token incorrecto. No se pudo descifrar la carpeta.");
        }
      }
      if ((casoDb as any).documentos) {
        const docsDescifrados = [];
        for (const d of (casoDb as any).documentos) {
           try {
             const contenido = await descifrarDatos(d.datosCifrados, nuevaDek);
             docsDescifrados.push({ nombre: d.nombre, contenido, datosCifrados: d.datosCifrados });
           } catch(e) {
             console.warn("No se pudo descifrar el documento: " + d.nombre);
           }
        }
        setDocs(docsDescifrados);
      }
    }
    setDek(nuevaDek);
    setTokenInput('');
  };

  const cerrarBoveda = () => {
    setDek(null);
    setTextoPlano('');
    setDocs([]);
    setTab('ficha');
  };

  const guardarCambios = async () => {
    if (!dek) return;
    if (!textoPlano.trim()) return alert("Escribe algo para cifrar.");
    
    const paquete = await cifrarDatos(textoPlano, dek);
    
    const casoDb = await db.casos.get(casoId);
    const docsExistentes = (casoDb as any)?.documentos || [];

    await guardarCasoLocal({
      id: casoId,
      estado: estadoCaso, // <-- Guardamos el nuevo estado
      fecha: casoDb?.fecha || new Date().toISOString(),
      region: casoDb?.region || 'Tarapacá',
      categoria: casoDb?.categoria || 'Trámite migratorio',
      datosCifrados: paquete,
      documentos: docsExistentes
    } as any);

    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  };

  const eliminarCaso = async () => {
    const confirmacion = prompt(`⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEstás a punto de eliminar PERMANENTEMENTE el caso ${casoId} y todos sus documentos cifrados.\n\nEsta acción no se puede deshacer.\n\nPara confirmar, escribe "ELIMINAR":`);
    
    if (confirmacion === 'ELIMINAR') {
      try {
        await db.casos.delete(casoId);
        alert("🗑️ Caso eliminado de la base de datos local.");
        onVolver(); // Regresa a la lista
      } catch (error) {
        alert("❌ Error al eliminar el caso.");
      }
    } else {
      alert("Operación cancelada. El caso está a salvo.");
    }
  };

  const sincronizarConNube = async () => {
    const casoDb = await db.casos.get(casoId);
    if (!casoDb || !casoDb.datosCifrados) return alert("Primero debes guardar los datos del caso.");

    subirCasoANube({
      id: casoDb.id,
      region: casoDb.region,
      categoria: casoDb.categoria,
      fecha: casoDb.fecha,
      datosCifrados: casoDb.datosCifrados
    });

    setSincronizado(true);
    setTimeout(() => setSincronizado(false), 3000);
  };

  const subirDocumento = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !dek) return;

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Content = reader.result as string;
        const paqueteCifrado = await cifrarDatos(base64Content, dek);
        
        const nuevoDoc = { nombre: file.name, datosCifrados: paqueteCifrado };
        const nuevosDocs = [...docs, { nombre: file.name, contenido: base64Content, datosCifrados: paqueteCifrado }];
        setDocs(nuevosDocs);

        const casoDb = await db.casos.get(casoId);
        const docsParaGuardar = nuevosDocs.map(d => ({ nombre: d.nombre, datosCifrados: d.datosCifrados }));
        
        await guardarCasoLocal({
          ...casoDb,
          id: casoId,
          estado: estadoCaso,
          fecha: casoDb?.fecha || new Date().toISOString(),
          region: casoDb?.region || 'Tarapacá',
          categoria: casoDb?.categoria || 'Trámite migratorio',
          documentos: docsParaGuardar
        } as any);

        alert("✅ Documento cifrado y adjuntado al caso.");
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("❌ Error al procesar el archivo.");
    }
  };

  const descargarDocumento = (nombre: string, contenidoBase64: string) => {
    const link = document.createElement('a');
    link.href = contenidoBase64;
    link.download = nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarPDF = async () => {
    setGenerandoPdf(true);
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      page.drawText('REPORTE CONFIDENCIAL DE CASO', { x: 50, y: 750, size: 20, font: fontBold, color: rgb(0.1, 0.4, 0.2) });
      page.drawText(`Código Interno: ${casoId}`, { x: 50, y: 700, size: 12, font });
      page.drawText(`Estado: ${estadoCaso}`, { x: 50, y: 685, size: 12, font: fontBold });
      page.drawText(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, { x: 50, y: 670, size: 12, font });
      page.drawText('Detalles del Caso (Datos Descifrados Localmente):', { x: 50, y: 630, size: 14, font: fontBold });
      
      page.drawText(textoPlano || "No hay notas.", { x: 50, y: 590, size: 12, font: font, maxWidth: 500, lineHeight: 16 });
      page.drawText(`Documentos adjuntos: ${docs.length}`, { x: 50, y: 490, size: 12, font: fontBold });

      page.drawText('ADVERTENCIA DE SEGURIDAD:', { x: 50, y: 150, size: 10, font: fontBold, color: rgb(0.8, 0.1, 0.1) });
      page.drawText('Este documento contiene datos sensibles. Destrúyalo de forma segura.', { x: 50, y: 130, size: 10, font });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_${casoId}_Confidencial.pdf`;
      link.click();
    } catch (error) {
      alert("Error al generar el PDF.");
    } finally {
      setGenerandoPdf(false);
    }
  };

  return (
    <div className="caso-detalle-contenedor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="boton-volver" onClick={onVolver}>← Volver a Mis Casos</button>
        {dek && <button className="boton-secundario" onClick={cerrarBoveda} style={{ fontSize: '0.875rem', padding: '0.4rem 0.8rem' }}>🔒 Cerrar Bóveda</button>}
      </div>
      
      <h2>Carpeta del Caso: {casoId}</h2>
      
      {!dek ? (
        <div className="boveda-bloqueada">
          <h3>Esta carpeta está bloqueada (Cifrado E2EE).</h3>
          <p style={{ marginBottom: '1rem', marginTop: '0.5rem' }}>Introduce el token de acceso para descifrar los datos.</p>
          <input 
            type="password" 
            placeholder="Ingresa el Token" 
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            style={{ padding: '0.5rem', width: '100%', maxWidth: '300px', marginBottom: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <br />
          <button className="boton-primario" onClick={abrirBoveda}>
            🔐 Desbloquear Carpeta
          </button>
        </div>
      ) : (
        <div className="boveda-abierta">
          <div className="tabs">
            <button className={`tab ${tab === 'ficha' ? 'activo' : ''}`} onClick={() => setTab('ficha')}>Ficha del Caso</button>
            <button className={`tab ${tab === 'docs' ? 'activo' : ''}`} onClick={() => setTab('docs')}>Documentos ({docs.length})</button>
          </div>

          {tab === 'ficha' && (
            <div className="contenido-ficha">
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>Datos del Caso (Descifrados)</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}>
                  Estado:
                  <select 
                    value={estadoCaso} 
                    onChange={(e) => setEstadoCaso(e.target.value)}
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid #ccc' }}>
                    <option>En seguimiento</option>
                    <option>En revisión</option>
                    <option>Finalizado</option>
                  </select>
                </label>
              </div>

              <textarea 
                rows={6}
                value={textoPlano}
                onChange={(e) => setTextoPlano(e.target.value)}
              />
              <div className="botones-accion" style={{ flexWrap: 'wrap', marginBottom: '2rem' }}>
                <button className="boton-primario" onClick={guardarCambios}>
                  🔒 Guardar Cambios Cifrados
                </button>
                <button className="boton-primario" onClick={sincronizarConNube} style={{ backgroundColor: '#0ea5e9' }}>
                  ☁️ Sincronizar a la Nube
                </button>
                <button 
                  className="boton-primario" 
                  onClick={exportarPDF} 
                  disabled={generandoPdf}
                  style={{ backgroundColor: '#1d4ed8' }}>
                  {generandoPdf ? 'Generando...' : '📄 Exportar PDF'}
                </button>
              </div>
              
              {guardado && <p className="mensaje-exito">✅ Datos y estado cifrados actualizados.</p>}
              {sincronizado && <p className="mensaje-exito" style={{ color: '#0284c7' }}>☁️ Caso sincronizado exitosamente con el servidor ciego.</p>}

              {/* Zona de Peligro */}
              <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #fecaca', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
                <h4 style={{ color: '#991b1b', marginBottom: '0.5rem' }}>Zona de Peligro</h4>
                <p style={{ fontSize: '0.875rem', color: '#7f1d1d', marginBottom: '1rem' }}>
                  Si este caso fue creado por error o está duplicado, puedes eliminarlo permanentemente del dispositivo.
                </p>
                <button 
                  onClick={eliminarCaso}
                  style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  🗑️ Eliminar Caso Permanentemente
                </button>
              </div>
            </div>
          )}

          {tab === 'docs' && (
            <div className="contenido-docs">
              <h3>Documentos Adjuntos</h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.875rem' }}>
                Los archivos se cifran en tu dispositivo antes de guardarse.
              </p>
              
              <label className="boton-secundario" style={{ display: 'inline-block', cursor: 'pointer', marginBottom: '1rem' }}>
                + Adjuntar Documento (Imagen/PDF)
                <input type="file" onChange={subirDocumento} style={{ display: 'none' }} />
              </label>

              {docs.length === 0 ? (
                <p style={{ color: '#666' }}>No hay documentos adjuntos.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {docs.map((d, i) => (
                    <li key={i} style={{ padding: '0.5rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📄 {d.nombre}</span>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#16a34a' }}>🔒 Cifrado</span>
                        <button 
                          onClick={() => descargarDocumento(d.nombre, d.contenido)}
                          className="boton-texto" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                          Descargar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

