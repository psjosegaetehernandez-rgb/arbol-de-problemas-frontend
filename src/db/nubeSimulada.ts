// src/db/nubeSimulada.ts
import { supabase } from './supabaseClient';

export interface BlobNube {
  id?: string;
  case_id: string;
  region: string;
  categoria: string;
  fecha: string;
  datos_cifrados: any; // El sobre E2EE
}

export async function subirCasoANube(caso: BlobNube) {
  // Verificar si ya existe para no duplicar
  const { data: existente } = await supabase
    .from('casos_nube')
    .select('id')
    .eq('case_id', caso.case_id);

  if (existente && existente.length > 0) {
     const { error } = await supabase
      .from('casos_nube')
      .update({ datos_cifrados: caso.datos_cifrados, fecha: caso.fecha })
      .eq('case_id', caso.case_id);
     if (error) throw error;
  } else {
     const { error } = await supabase
      .from('casos_nube')
      .insert([caso]);
     if (error) throw error;
  }
}

export async function obtenerNube(): Promise<BlobNube[]> {
  const { data, error } = await supabase
    .from('casos_nube')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error al leer la nube:", error);
    return [];
  }
  return data || [];
}
