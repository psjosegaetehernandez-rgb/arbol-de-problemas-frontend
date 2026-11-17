// src/db/database.ts
import Dexie, { type Table } from 'dexie';

export interface CasoLocal {
  id: string;
  estado: string;
  fecha: string;
  region: string;
  categoria: string;
  datosCifrados?: any;
}

export const db = new Dexie('ArbolDeProblemasDB') as Dexie & {
  casos: Table<CasoLocal>
};

db.version(1).stores({
  casos: 'id, estado, fecha, region, categoria'
});

export async function guardarCasoLocal(caso: CasoLocal) {
  return await db.casos.put(caso);
}

export async function obtenerCasosLocales() {
  return await db.casos.toArray();
}
