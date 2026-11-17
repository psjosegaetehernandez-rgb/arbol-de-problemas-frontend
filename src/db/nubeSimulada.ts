// src/db/nubeSimulada.ts

export interface BlobNube {
  id: string;
  region: string;
  categoria: string;
  fecha: string;
  datosCifrados: any; // El sobre E2EE
}

const NUBE_KEY = 'arbol_nube_blind_server';

export function subirCasoANube(caso: BlobNube) {
  const nubeActual = obtenerNube();
  // Evitar duplicados por ID
  const nuevaNube = nubeActual.filter(c => c.id !== caso.id);
  nuevaNube.push(caso);
  localStorage.setItem(NUBE_KEY, JSON.stringify(nuevaNube));
}

export function obtenerNube(): BlobNube[] {
  const data = localStorage.getItem(NUBE_KEY);
  return data ? JSON.parse(data) : [];
}
