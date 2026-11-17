// src/components/RedNacional.tsx
import { useState, useEffect } from 'react';
import { obtenerNube, type BlobNube } from '../db/nubeSimulada';

export default function RedNacional() {
  const [datosNube, setDatosNube] = useState<BlobNube[]>([]);

  useEffect(() => {
    setDatosNube(obtenerNube());
  }, []);

  const total = datosNube.length;
  
  // Agrupación por región
  const regiones = Array.from(new Set(datosNube.map(c => c.region)));
  const statsRegiones = regiones.map(r => {
    const cant = datosNube.filter(c => c.region === r).length;
    return { nombre: r, cantidad: cant > 0 && cant < 5 ? 'Agrupado (<5)' : cant, isAgrupado: cant > 0 && cant < 5 };
  });

  // Agrupación por categoría
  const categorias = Array.from(new Set(datosNube.map(c => c.categoria)));
  const statsCategorias = categorias.map(cat => {
    const cant = datosNube.filter(c => c.categoria === cat).length;
    return { nombre: cat, cantidad: cant > 0 && cant < 5 ? 'Agrupado (<5)' : cant, isAgrupado: cant > 0 && cant < 5 };
  });

  return (
    <section className="panel">
      <h2>Dashboard Red Nacional</h2>
      <p>Vista agregada de todas las organizaciones conectadas al servidor ciego.</p>
      
      <div className="aviso" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1e3a8a', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
        <strong>ℹ️ Nota del Sistema:</strong> Esta vista solo lee los metadatos públicos (región, categoría). Los datos de las personas están cifrados y son inaccesibles para la coordinación de la Red.
      </div>

      <div className="metricas" style={{ marginBottom: '2rem' }}>
        <article className="metrica">
          <div className="metrica-superior"><span>Casos Totales en la Nube</span><span>☁️</span></div>
          <strong>{total > 0 && total < 5 ? 'Agrupado (<5)' : total}</strong>
          <small>Recibidos desde todas las regiones</small>
        </article>
      </div>

      <div className="paneles">
        <section className="panel" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <h3>Distribución por Región</h3>
          {statsRegiones.length === 0 ? <p className="vacio">No hay datos sincronizados.</p> : null}
          {statsRegiones.map(r => (
            <div className="fila-region" key={r.nombre}>
              <span>{r.nombre}</span>
              <strong style={r.isAgrupado ? { color: '#ca8a04', fontSize: '0.85em' } : {}}>
                {r.cantidad}
              </strong>
            </div>
          ))}
        </section>

        <section className="panel" style={{ boxShadow: 'none', border: '1px solid #e5e7eb' }}>
          <h3>Distribución por Categoría</h3>
          {statsCategorias.length === 0 ? <p className="vacio">No hay datos sincronizados.</p> : null}
          {statsCategorias.map(c => (
            <div className="fila-region" key={c.nombre}>
              <span>{c.nombre}</span>
              <strong style={c.isAgrupado ? { color: '#ca8a04', fontSize: '0.85em' } : {}}>
                {c.cantidad}
              </strong>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}
