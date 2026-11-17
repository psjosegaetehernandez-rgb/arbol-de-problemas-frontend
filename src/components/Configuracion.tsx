// src/components/Configuracion.tsx
import { useState } from 'react';
import { db } from '../db/database';
import { cifrarDatos, derivarLlaveDesdeTexto, descifrarDatos } from '../crypto/e2ee';

export default function Configuracion() {
  const [exportando, setExportando] = useState(false);

  const exportarRespaldo = async () => {
    try {
      setExportando(true);
      const password = prompt("Crea una contraseña para cifrar este respaldo.\n\n¡ADVERTENCIA! Si pierdes esta contraseña, los datos serán irrecuperables.");
      if (!password) { setExportando(false); return; }

      const todosLosCasos = await db.casos.toArray();
      const jsonString = JSON.stringify(todosLosCasos);
      const dek = await derivarLlaveDesdeTexto(password);
      const paqueteCifrado = await cifrarDatos(jsonString, dek);

      const respaldoFinal = { version: 1, fecha: new Date().toISOString(), datos: paqueteCifrado };
      const blob = new Blob([JSON.stringify(respaldoFinal)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `respaldo_arbol_${new Date().toISOString().split('T')[0]}.json.enc`;
      link.click();
      
      alert("✅ Respaldo cifrado descargado exitosamente.");
    } catch (error) {
      alert("❌ Error al generar el respaldo.");
    } finally {
      setExportando(false);
    }
  };

  const importarRespaldo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const password = prompt("Ingresa la contraseña con la que cifraste este respaldo:");
    if (!password) return;

    try {
      const fileContent = await file.text();
      const respaldoJSON = JSON.parse(fileContent);
      
      // Desciframos el paquete usando la contraseña
      const dek = await derivarLlaveDesdeTexto(password);
      const jsonDescifrado = await descifrarDatos(respaldoJSON.datos, dek);
      const casosRecuperados = JSON.parse(jsonDescifrado);

      // Guardamos en IndexedDB (sobrescribe si el ID ya existe)
      await db.casos.bulkPut(casosRecuperados);
      
      alert(`✅ ¡Éxito! Se han recuperado ${casosRecuperados.length} casos de la base de datos.`);
      window.location.reload(); // Recargamos para que se vean reflejados en la interfaz
    } catch (error) {
      console.error(error);
      alert("❌ Contraseña incorrecta o archivo de respaldo corrupto.");
    }
  };

  return (
    <section className="panel">
      <h2>Configuración del sistema</h2>
      <p>Identidad visual, organizaciones, regiones y parámetros de funcionamiento.</p>
      
      <div className="fila-region"><span>Nombre de la plataforma</span><strong>Árbol de Problemas</strong></div>
      <div className="fila-region"><span>Modo de operación</span><strong>Demostración local</strong></div>
      <div className="fila-region"><span>Almacenamiento persistente</span><strong>IndexedDB Activo</strong></div>
      <div className="fila-region"><span>Cifrado E2EE</span><strong>Implementado (AES-256)</strong></div>
      
      <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>Seguridad y Resiliencia</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
          Exporta o restaura copias de seguridad cifradas de todos los casos guardados en este dispositivo.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={exportarRespaldo} disabled={exportando} className="boton-primario" style={{ backgroundColor: '#0f766e' }}>
            {exportando ? 'Cifrando...' : '🔒 Exportar Respaldo (.json.enc)'}
          </button>
          
          <label className="boton-secundario" style={{ cursor: 'pointer', display: 'inline-block', padding: '0.5rem 1rem', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
            🔓 Importar Respaldo
            <input type="file" accept=".enc" onChange={importarRespaldo} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    </section>
  );
}
