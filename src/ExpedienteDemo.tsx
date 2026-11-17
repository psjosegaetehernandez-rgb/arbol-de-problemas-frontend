import { useState, type FormEvent } from 'react'

type Caso = {
  id: string
  fecha: string
  categoria: string
  estado: string
  region: string
  descripcion: string
  organizacion?: string
  comuna?: string
  motivo?: string
  resultado?: string
}

type ActuacionDemo = {
  id: string
  fecha: string
  tipo: string
  descripcion: string
}

interface Props {
  caso: Caso
  actuaciones: ActuacionDemo[]
  onVolver: () => void
  onEstado: (id: string, estado: string) => void
  onActuacion: (id: string, actuacion: ActuacionDemo) => void
}

type Pestana = 'Ficha general' | 'Actuaciones' | 'Documentos' | 'Accesos'

export default function ExpedienteDemo({
  caso, actuaciones, onVolver, onEstado, onActuacion
}: Props) {
  const [pestana, setPestana] = useState<Pestana>('Ficha general')
  const [tipo, setTipo] = useState('Atención')
  const [descripcion, setDescripcion] = useState('')

  function agregar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!descripcion.trim()) return

    const fecha = new Date()
    const fechaLocal = [
      fecha.getFullYear(),
      String(fecha.getMonth() + 1).padStart(2, '0'),
      String(fecha.getDate()).padStart(2, '0')
    ].join('-')

    onActuacion(caso.id, {
      id: crypto.randomUUID(),
      fecha: fechaLocal,
      tipo,
      descripcion: descripcion.trim()
    })
    setDescripcion('')
  }

  const pestanas: Pestana[] = [
    'Ficha general', 'Actuaciones', 'Documentos', 'Accesos'
  ]

  return (
    <div className="expediente-demo">
      <button className="boton-texto" onClick={onVolver}>
        ← Volver a mis casos
      </button>

      <div className="expediente-encabezado">
        <div>
          <small>EXPEDIENTE DE DEMOSTRACIÓN</small>
          <h2>{caso.id}</h2>
          <p>{caso.region} · Apertura: {caso.fecha}</p>
        </div>
        <span className="estado">{caso.estado}</span>
      </div>

      <div className="expediente-pestanas" role="tablist"
        aria-label="Secciones del expediente">
        {pestanas.map(p => (
          <button key={p} role="tab"
            aria-selected={pestana === p}
            className={pestana === p ? 'seleccionada' : ''}
            onClick={() => setPestana(p)}>
            {p}
          </button>
        ))}
      </div>

      {pestana === 'Ficha general' && (
        <section>
          <h3>Información del expediente</h3>
          <div className="ficha-grid">
            <div><small>Categoría</small><strong>{caso.categoria}</strong></div>
            <div><small>Región</small><strong>{caso.region}</strong></div>
            <div><small>Fecha de apertura</small><strong>{caso.fecha}</strong></div>
            <div>
              <small>Estado</small>
              <select value={caso.estado}
                onChange={e => onEstado(caso.id, e.target.value)}>
                <option>En revisión</option>
                <option>En seguimiento</option>
                <option>Finalizado</option>
              </select>
            </div>
          </div>
          <h3>Datos territoriales y atención</h3>

          <div className="ficha-grid">
            <div>
              <small>Organización responsable</small>
              <strong>{caso.organizacion ?? 'No especificada'}</strong>
            </div>
            <div>
              <small>Comuna</small>
              <strong>{caso.comuna ?? 'No especificada'}</strong>
            </div>
            <div>
              <small>Motivo de consulta</small>
              <strong>{caso.motivo ?? 'No especificado'}</strong>
            </div>
            <div>
              <small>Resultado preliminar</small>
              <strong>{caso.resultado ?? 'Pendiente'}</strong>
            </div>
          </div>

          <h3>Descripción del caso</h3>
          <p>{caso.descripcion}</p>
          <div className="aviso">
            Esta es una ficha ficticia sin identificación personal.
            Los campos adicionales del formulario se integrarán
            cuando unifiquemos el modelo de datos.
          </div>
        </section>
      )}

      {pestana === 'Actuaciones' && (
        <section>
          <h3>Historial de actuaciones</h3>
          <p>Registra seguimientos de demostración.</p>

          <form className="actuacion-formulario" onSubmit={agregar}>
            <label>Tipo de actuación
              <select value={tipo}
                onChange={e => setTipo(e.target.value)}>
                <option>Atención</option>
                <option>Seguimiento</option>
                <option>Derivación</option>
              </select>
            </label>

            <label>Descripción ficticia
              <textarea required rows={3} maxLength={1000}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Describe una actuación simulada..." />
            </label>

            <button className="boton-primario" type="submit">
              Registrar actuación
            </button>
          </form>

          <div className="actuaciones-lista">
            {actuaciones.length === 0 && (
              <p>No existen actuaciones registradas en esta sesión.</p>
            )}
            {[...actuaciones].reverse().map(a => (
              <article className="actuacion-item" key={a.id}>
                <div className="actuacion-meta">
                  <strong>{a.tipo}</strong>
                  <small>{a.fecha}</small>
                </div>
                <p>{a.descripcion}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {pestana === 'Documentos' && (
        <section>
          <h3>Carpeta documental</h3>
          <p>Cada expediente dispondrá de su propia carpeta lógica cifrada.</p>
          <div className="aviso">
            La carga de archivos está deshabilitada hasta implementar
            cifrado, permisos y almacenamiento seguro.
          </div>
        </section>
      )}

      {pestana === 'Accesos' && (
        <section>
          <h3>Permisos del expediente</h3>
          <p>En producción, cada usuario tendrá acceso únicamente
            a los casos expresamente autorizados.</p>
          <div className="aviso">
            No hay autenticación ni códigos de acceso activos
            en este prototipo.
          </div>
        </section>
      )}
    </div>
  )
}

