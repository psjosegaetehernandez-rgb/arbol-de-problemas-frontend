/**
 * ARBOL DE PROBLEMAS
 * Modelo de dominio v0.1
 *
 * SOLO DESARROLLO.
 * No almacenar datos personales reales.
 */

export const CATEGORIAS = [
  'Tramite migratorio',
  'Vulneracion de derechos',
  'Derivacion',
  'Orientacion',
  'Otro',
] as const

export const ESTADOS = [
  'Abierto',
  'En revision',
  'En seguimiento',
  'Derivado',
  'Cerrado',
] as const

export const RESULTADOS = [
  'Pendiente',
  'Orientacion entregada',
  'Derivacion realizada',
  'Gestion completada',
  'Sin resolucion',
] as const

export type Categoria = typeof CATEGORIAS[number]
export type EstadoCaso = typeof ESTADOS[number]
export type ResultadoCaso = typeof RESULTADOS[number]

export interface PersonaProtegida {
  nombreCompleto?: string
  documentoIdentidad?: string
  contacto?: string
  nacionalidad?: string
}

export interface Actuacion {
  id: string
  fecha: string
  tipo: 'Atencion' | 'Seguimiento' | 'Derivacion'
  descripcion: string
}

export interface DocumentoCaso {
  id: string
  nombreOriginal: string
  tipoMime: string
  tamanoBytes: number
  fechaCarga: string
  referenciaCifrada?: string
}

export interface Expediente {
  id: string
  organizacionId: string
  region: string
  comuna: string
  fechaApertura: string
  fechaCierre?: string
  categoria: Categoria
  estado: EstadoCaso
  resultado: ResultadoCaso

  // Campos privados: cifrar antes de persistir.
  persona: PersonaProtegida
  relato: string
  actuaciones: Actuacion[]
  documentos: DocumentoCaso[]
}

export interface ResumenMensual {
  periodo: string
  nuevos: number
  activosAlCierre: number
  cerrados: number
  atenciones: number
}

/**
 * Calcula indicadores a partir de expedientes
 * previamente autorizados y descifrados.
 *
 * No publica los datos individuales.
 */
export function resumirMes(
  expedientes: Expediente[],
  periodo: string
): ResumenMensual {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)) {
    throw new Error('Periodo invalido. Utilizar AAAA-MM.')
  }

  const fin = `${periodo}-31`

  return {
    periodo,

    nuevos: expedientes.filter(
      e => e.fechaApertura.startsWith(periodo)
    ).length,

    activosAlCierre: expedientes.filter(
      e => e.fechaApertura <= fin &&
        (!e.fechaCierre || e.fechaCierre > fin)
    ).length,

    cerrados: expedientes.filter(
      e => e.fechaCierre?.startsWith(periodo)
    ).length,

    atenciones: expedientes.reduce(
      (total, e) =>
        total + e.actuaciones.filter(
          a => a.tipo === 'Atencion' &&
            a.fecha.startsWith(periodo)
        ).length,
      0
    ),
  }
}
