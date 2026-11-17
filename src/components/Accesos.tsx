// src/components/Accesos.tsx

interface Caso {
  id: string;
  categoria: string;
  region: string;
}

export default function Accesos({ casos }: { casos: Caso[] }) {
  return (
    <section className="panel">
      <h2>Gestión de Accesos (CapBAC)</h2>
      <p>Administración de llaves criptográficas por carpeta.</p>
      
      <div className="aviso" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', color: '#1e3a8a', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
        <strong>🔒 Protocolo de Seguridad:</strong> Los Tokens de acceso se generan <b>al momento de crear el caso</b>. Por seguridad Zero-Knowledge, el sistema <b>no guarda los tokens en texto plano</b>, por lo que no pueden recuperarse desde esta pantalla.
      </div>

      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Código del Caso</th>
              <th>Categoría</th>
              <th>Región</th>
              <th>Estado del Token</th>
            </tr>
          </thead>
          <tbody>
            {casos.map(c => (
              <tr key={c.id}>
                <td><b>{c.id}</b></td>
                <td>{c.categoria}</td>
                <td>{c.region}</td>
                <td>
                  <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '0.85rem' }}>🔑 Activo</span>
                </td>
              </tr>
            ))}
            {casos.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>No hay casos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

