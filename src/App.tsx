import { useMemo, useState, useEffect } from 'react'
import FormularioCaso, { type FormularioData } from './FormularioCaso'
import CasoDetalle from './components/caso/CasoDetalle'
import Accesos from './components/Accesos'
import Configuracion from './components/Configuracion'
import Informes from './components/Informes'
import RedNacional from './components/RedNacional'
import { cifrarDatos, derivarLlaveDesdeTexto } from './crypto/e2ee'
import { guardarCasoLocal, db } from './db/database'
import './App.css'

type Modulo = 'Panel general' | 'Mis casos' | 'Estadísticas' |
  'Informes' | 'Accesos' | 'Configuración'

type Caso = {
  id: string
  fecha: string
  categoria: string
  estado: string
  region: string
  descripcion: string
}

const modulos: { nombre: Modulo; icono: string }[] = [
  { nombre: 'Panel general', icono: '▦' },
  { nombre: 'Mis casos', icono: '▤' },
  { nombre: 'Estadísticas', icono: '▥' },
  { nombre: 'Informes', icono: '▧' },
  { nombre: 'Accesos', icono: '◇' },
  { nombre: 'Configuración', icono: '⚙' },
]

const categorias = ['Trámite migratorio', 'Vulneración de derechos', 'Derivación', 'Orientación', 'Otro']

export default function App() {
  const [modulo, setModulo] = useState<Modulo>('Panel general')
  const [casos, setCasos] = useState<Caso[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7)) // Mes actual por defecto
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [nuevo, setNuevo] = useState(false)
  const [menu, setMenu] = useState(false)

  // 1. CIRUGÍA: Cargar datos reales de IndexedDB al iniciar
  useEffect(() => {
    cargarCasosDesdeDB()
  }, [])

  const cargarCasosDesdeDB = async () => {
    try {
      const casosDB = await db.casos.toArray()
      // Mapeamos los datos de la DB (que tienen los metadatos públicos) al tipo Caso de la UI
      const mapeados: Caso[] = casosDB.map(c => ({
        id: c.id,
        fecha: c.fecha,
        categoria: c.categoria,
        estado: c.estado,
        region: c.region,
        descripcion: 'Datos cifrados. Abre el caso para ver los detalles.'
      }))
      // Ordenar por fecha descendente
      mapeados.sort((a, b) => b.fecha.localeCompare(a.fecha))
      setCasos(mapeados)
    } catch (error) {
      console.error("Error al cargar casos", error)
    } finally {
      setCargando(false)
    }
  }

  const mensuales = useMemo(
    () => casos.filter(c => c.fecha.startsWith(mes)),
    [casos, mes]
  )

  const total = mensuales.length
  const seguimiento = mensuales.filter(c => c.estado === 'En seguimiento').length
  const revision = mensuales.filter(c => c.estado === 'En revisión').length
  const finalizados = mensuales.filter(c => c.estado === 'Finalizado').length

  const visibles = casos.filter(c =>
    `${c.id} ${c.categoria} ${c.estado} ${c.region}`.toLowerCase()
      .includes(busqueda.toLowerCase())
  )

  const casoActual = casos.find(c => c.id === seleccionado)

  function cambiarModulo(nombre: Modulo) {
    setModulo(nombre)
    setSeleccionado(null)
    setMenu(false)
  }

  // 2. CIRUGÍA: Crear caso, cifrar y recargar la lista desde la DB
  async function crearCaso(datos: FormularioData) {
    // Generar ID secuencial basado en los casos existentes
    const siguiente = casos.length > 0 
      ? Math.max(0, ...casos.map(c => Number(c.id.replace('DEMO-', '')) || 0)) + 1
      : 1;

    const nuevoId = `DEMO-${String(siguiente).padStart(3, '0')}`

    // Ciframos los datos del formulario usando el Token ÚNICO que definió el usuario
    const dek = await derivarLlaveDesdeTexto(datos.token);
    const paquete = await cifrarDatos(JSON.stringify(datos), dek);
    
    // Guardamos en Dexie (IndexedDB) manteniendo los metadatos públicos para las tablas
    await guardarCasoLocal({
      id: nuevoId,
      estado: datos.estado,
      fecha: datos.fecha,
      region: datos.region,
      categoria: datos.categoria,
      datosCifrados: paquete
    } as any);

    // Recargamos la lista desde la base de datos para que aparezca en la UI
    await cargarCasosDesdeDB()
    
    setNuevo(false)
    setModulo('Mis casos')
    setSeleccionado(nuevoId)
  }

  const conteos = [
    { nombre: 'Casos del mes', valor: total, icono: '▤' },
    { nombre: 'En seguimiento', valor: seguimiento, icono: '◷' },
    { nombre: 'En revisión', valor: revision, icono: '◎' },
    { nombre: 'Finalizados', valor: finalizados, icono: '✓' },
  ]

  if (cargando) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#0f766e' }}>Cargando base de datos segura...</div>
  }

  return (
    <div className="aplicacion">
      <aside className={`lateral ${menu ? 'abierto' : ''}`}>
        <div className="marca">
          <div className="marca-icono">A</div>
          <div><strong>Árbol de Problemas</strong><small>Gestión territorial</small></div>
        </div>

        <div className="etiqueta-menu">ESPACIO DE TRABAJO</div>
        <nav aria-label="Navegación principal">
          {modulos.map(item => (
            <button key={item.nombre}
              className={`nav-item ${modulo === item.nombre ? 'activo' : ''}`}
              onClick={() => cambiarModulo(item.nombre)}>
              <span className="nav-icono">{item.icono}</span>{item.nombre}
            </button>
          ))}
        </nav>

        <div className="lateral-pie">
          <span className="punto"></span> Entorno de demostración
          <small>Sin usuarios ni datos reales</small>
        </div>
      </aside>

      <div className="principal">
        <header className="cabecera">
          <div className="cabecera-izq">
            <button className="menu-movil" onClick={() => setMenu(!menu)}
              aria-label="Abrir o cerrar menú">☰</button>
            <span className="ruta">Plataforma / <b>{modulo}</b></span>
          </div>
          <div className="usuario"><span className="usuario-circulo">D</span> Usuario demo</div>
        </header>

        <main className="contenido">
          <div className="titulo-seccion">
            <div>
              <div className="sobrelinea">SISTEMA DE GESTIÓN TERRITORIAL</div>
              <h1>{modulo}</h1>
              <p>Entorno de prueba con información completamente ficticia.</p>
            </div>
            {(modulo === 'Panel general' || modulo === 'Mis casos') &&
              <button className="boton-primario" onClick={() => setNuevo(true)}>+ Nuevo caso demo</button>}
          </div>

          {modulo === 'Panel general' && (
            <>
              <div className="barra-filtros">
                <label>Período <input type="month" value={mes}
                  onChange={e => setMes(e.target.value)} /></label>
                <span>Datos de ejemplo · no representan atenciones reales</span>
              </div>

              <div className="metricas">
                {conteos.map(item => (
                  <article className="metrica" key={item.nombre}>
                    <div className="metrica-superior"><span>{item.nombre}</span><span>{item.icono}</span></div>
                    <strong>{item.valor}</strong><small>Período seleccionado</small>
                  </article>
                ))}
              </div>

              <div className="paneles">
                <section className="panel">
                  <h2>Distribución por categoría</h2>
                  <p>Casos registrados durante el período seleccionado</p>
                  {categorias.map(nombre => {
                    const cantidadReal = mensuales.filter(c => c.categoria === nombre).length
                    const isGrouped = cantidadReal > 0 && cantidadReal < 5
                    const cantidadMostrar = isGrouped ? "Agrupado (<5)" : cantidadReal
                    const porcentaje = total ? (cantidadReal / total * 100) : 0
                    
                    return (
                      <div className="barra-item" key={nombre}>
                        <div className="barra-encabezado">
                          <span>{nombre}</span>
                          <b style={isGrouped ? { color: '#ca8a04', fontSize: '0.85em' } : {}}>
                            {cantidadMostrar}
                          </b>
                        </div>
                        <div className="barra-fondo">
                          <div className="barra-valor" style={{ width: `${porcentaje}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </section>
                
                <section className="panel">
                  <h2>Resumen territorial</h2>
                  <p>Distribución de casos por región</p>
                  {Array.from(new Set(mensuales.map(c => c.region))).map(r => {
                    const cantidadReal = mensuales.filter(c => c.region === r).length
                    const isGrouped = cantidadReal > 0 && cantidadReal < 5
                    const cantidadMostrar = isGrouped ? "Agrupado (<5)" : cantidadReal
                    
                    return (
                      <div className="fila-region" key={r}>
                        <span>{r}</span>
                        <strong style={isGrouped ? { color: '#ca8a04', fontSize: '0.85em' } : {}}>
                          {cantidadMostrar}
                        </strong>
                      </div>
                    )
                  })}
                  {!total && <div className="vacio">No hay registros para este mes.</div>}
                </section>
              </div>
            </>
          )}

          {modulo === 'Estadísticas' && <RedNacional />}

          {modulo === 'Mis casos' && (
            <section className="panel">
              {casoActual ? (
                <CasoDetalle casoId={casoActual.id} onVolver={() => { setSeleccionado(null); cargarCasosDesdeDB(); }} />
              ) : (
                <>
                  <h2>Casos registrados</h2>
                  <p>En esta fase todos los casos son ficticios, pero están cifrados localmente.</p>
                  <input className="buscador" placeholder="Buscar por código, categoría, estado o región..."
                    value={busqueda} onChange={e => setBusqueda(e.target.value)} />
                  <div className="tabla-contenedor">
                    <table>
                      <thead><tr><th>Código</th><th>Fecha</th><th>Categoría</th><th>Región</th><th>Estado</th><th></th></tr></thead>
                      <tbody>{visibles.map(c => (
                        <tr key={c.id}>
                          <td><b>{c.id}</b></td><td>{c.fecha}</td><td>{c.categoria}</td>
                          <td>{c.region}</td><td><span className="estado">{c.estado}</span></td>
                          <td><button className="boton-texto" onClick={() => setSeleccionado(c.id)}>Abrir</button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                    {!visibles.length && <div className="vacio">No se encontraron casos. Crea uno nuevo.</div>}
                  </div>
                </>
              )}
            </section>
          )}

          {modulo === 'Informes' && <Informes casos={casos} mes={mes} />}
          {modulo === 'Accesos' && <Accesos casos={casos} />}
          {modulo === 'Configuración' && <Configuracion />}
        </main>
      </div>

      {nuevo && <div className="modal-fondo" onClick={() => setNuevo(false)}>
        <div className="modal" role="dialog" aria-modal="true"
          aria-label="Crear caso de demostración" onClick={e => e.stopPropagation()}>
          <div className="modal-cabecera"><h2>Nuevo caso de demostración</h2>
            <button className="cerrar" onClick={() => setNuevo(false)} aria-label="Cerrar">×</button></div>
          <p>Utiliza únicamente información inventada.</p>
          <FormularioCaso onSubmit={crearCaso} onCancel={() => setNuevo(false)} />
        </div>
      </div>}
    </div>
  )
}


