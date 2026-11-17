// src/FormularioCaso.tsx
import { useState } from 'react';

export type FormularioData = {
  fecha: string;
  categoria: string;
  estado: string;
  region: string;
  descripcion: string;
  organizacion?: string;
  comuna?: string;
  motivo?: string;
  resultado?: string;
  token: string;
};

export default function FormularioCaso({ onSubmit, onCancel }: { onSubmit: (datos: FormularioData) => void, onCancel: () => void }) {
  // Generamos un token aleatorio por defecto (ej. A1B2-C3D4)
  const tokenAleatorio = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();

  const [form, setForm] = useState<FormularioData>({
    fecha: new Date().toISOString().split('T')[0],
    categoria: 'Trámite migratorio',
    estado: 'En seguimiento',
    region: 'Tarapacá',
    descripcion: '',
    token: tokenAleatorio
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.token.trim()) return alert("Debes asignar un Token de seguridad.");
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <label style={{ flex: 1 }}>
          Fecha:
          <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem' }} />
        </label>
        <label style={{ flex: 1 }}>
          Región:
          <input type="text" name="region" value={form.region} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem' }} />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <label style={{ flex: 1 }}>
          Categoría:
          <select name="categoria" value={form.categoria} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
            <option>Trámite migratorio</option>
            <option>Vulneración de derechos</option>
            <option>Derivación</option>
            <option>Orientación</option>
            <option>Otro</option>
          </select>
        </label>
        <label style={{ flex: 1 }}>
          Estado:
          <select name="estado" value={form.estado} onChange={handleChange} style={{ width: '100%', padding: '0.5rem' }}>
            <option>En seguimiento</option>
            <option>En revisión</option>
            <option>Finalizado</option>
          </select>
        </label>
      </div>

      <label>
        Descripción (se cifrará antes de guardar):
        <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={3} required style={{ width: '100%', padding: '0.5rem' }} />
      </label>

      <div style={{ backgroundColor: '#fef3c7', padding: '1rem', borderRadius: '4px', border: '1px solid #fde68a' }}>
        <label style={{ display: 'block', fontWeight: 'bold', color: '#92400e', marginBottom: '0.5rem' }}>
          ⚠️ Token de Acceso (Llave Criptográfica del Caso)
        </label>
        <p style={{ fontSize: '0.8rem', color: '#b45309', marginBottom: '0.5rem' }}>
          Este token es la ÚNICA forma de abrir esta carpeta. Cópialo y entrégalo al voluntario por un canal seguro. Si se pierde, los datos son irrecuperables.
        </p>
        <input type="text" name="token" value={form.token} onChange={handleChange} required style={{ width: '100%', padding: '0.5rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px' }} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
        <button type="button" onClick={onCancel} className="boton-secundario">Cancelar</button>
        <button type="submit" className="boton-primario">Guardar y Cifrar Caso</button>
      </div>
    </form>
  );
}
