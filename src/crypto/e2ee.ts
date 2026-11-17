// src/crypto/e2ee.ts
export async function derivarLlaveDesdeTexto(token: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw", enc.encode(token), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode("sal_fija_arbol"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function cifrarDatos(textoPlano: string, dek: CryptoKey): Promise<{ iv: number[], ciphertext: number[] }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(textoPlano);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, dek, data);
  return { iv: Array.from(iv), ciphertext: Array.from(new Uint8Array(ciphertext)) };
}

export async function descifrarDatos(paqueteCifrado: { iv: number[], ciphertext: number[] }, dek: CryptoKey): Promise<string> {
  const iv = new Uint8Array(paqueteCifrado.iv);
  const ciphertext = new Uint8Array(paqueteCifrado.ciphertext);
  const textoPlanoBuffer = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, dek, ciphertext);
  return new TextDecoder().decode(textoPlanoBuffer);
}
