/**
 * Solução definitiva para criptografia segura com suporte a caracteres especiais
 * Usando Web Crypto API nativo e codificação base64 adequada
 */

// Função auxiliar para converter string para ArrayBuffer
function strToArrayBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Função auxiliar para converter ArrayBuffer para string
function arrayBufferToStr(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

// Função auxiliar para converter ArrayBuffer para base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof window !== 'undefined') {
    // Browser
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
  // Node.js
  return Buffer.from(buffer).toString('base64');
}

// Função auxiliar para converter base64 para ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof window !== 'undefined') {
    // Browser
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  // Node.js
  return Buffer.from(base64, 'base64');
}

// Função auxiliar para converter string para base64
function strToBase64(str: string): string {
  if (typeof window !== 'undefined') {
    // Navegador
    return btoa(str);
  }
  // Node.js
  return Buffer.from(str).toString('base64');
}

// Função auxiliar para converter base64 para string
function base64ToStr(base64: string): string {
  if (typeof window !== 'undefined') {
    // Navegador
    return atob(base64);
  }
  // Node.js
  return Buffer.from(base64, 'base64').toString();
}

// Interface para o formato do payload criptografado
interface EncryptedPayload {
  data: string;  // Dados criptografados em base64
  iv: string;    // Vetor de inicialização em base64
}

/**
 * Interface para dados da visita
 */
export interface VisitData {
  property_id?: string | number;
  agent_id?: string | number;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  status?: string;
  feedback?: string;
  [key: string]: unknown;
}

/**
 * Criptografa dados usando AES-GCM com Web Crypto API
 * Método que funciona com qualquer tipo de caractere, incluindo especiais
 */
export async function encryptPayload<T>(payload: T, secretKey: string): Promise<string> {
  try {
    // Validar chave
    if (!secretKey || secretKey.length < 16) {
      throw new Error('Chave de criptografia inválida ou muito curta');
    }

    // Converter payload para string JSON
    const payloadString = JSON.stringify(payload);
    
    // Gerar vetor de inicialização aleatório
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Derivar a chave criptográfica a partir da senha
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      strToArrayBuffer(secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Criar chave AES a partir do material de chave
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: strToArrayBuffer('secure-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Criptografar os dados
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      strToArrayBuffer(payloadString)
    );
    
    // Criar objeto de resposta com dados criptografados e IV
    const encryptedPayload: EncryptedPayload = {
      data: arrayBufferToBase64(encryptedData),
      iv: arrayBufferToBase64(iv)
    };
    
    // Retornar o payload criptografado como string JSON
    return JSON.stringify(encryptedPayload);
    
  } catch (error) {
    console.error('[CRYPTO] Erro ao criptografar dados:', error);
    throw new Error(`Falha ao criptografar dados: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Descriptografa dados AES-GCM com Web Crypto API
 * Implementação robusta que funciona com caracteres especiais
 */
export async function decryptPayload<T = VisitData>(encryptedPayloadStr: string, secretKey: string): Promise<T> {
  try {
    // Validar chave
    if (!secretKey || secretKey.length < 16) {
      throw new Error('Chave de descriptografia inválida ou muito curta');
    }
    
    // Validar dados de entrada
    if (!encryptedPayloadStr) {
      throw new Error('Dados criptografados inválidos');
    }
    
    // Converter string JSON para objeto
    let encryptedPayload: EncryptedPayload;
    try {
      encryptedPayload = JSON.parse(encryptedPayloadStr) as EncryptedPayload;
      
      // Validar formato do payload
      if (!encryptedPayload.data || !encryptedPayload.iv) {
        throw new Error('Formato de dados criptografados inválido');
      }
    } catch (error) {
      throw new Error('Falha ao analisar dados criptografados');
    }
    
    // Converter base64 para ArrayBuffer
    const encryptedData = base64ToArrayBuffer(encryptedPayload.data);
    const iv = base64ToArrayBuffer(encryptedPayload.iv);
    
    // Derivar a chave criptográfica a partir da senha
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      strToArrayBuffer(secretKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Criar chave AES a partir do material de chave
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: strToArrayBuffer('secure-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Descriptografar os dados
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      key,
      encryptedData
    );
    
    // Converter ArrayBuffer para string
    const decryptedString = arrayBufferToStr(decryptedData);
    
    // Converter string JSON para objeto
    return JSON.parse(decryptedString) as T;
    
  } catch (error) {
    console.error('[CRYPTO] Erro ao descriptografar dados:', error);
    throw new Error(`Falha ao descriptografar dados: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Função auxiliar para converter string hex para texto
 */
function hexToStr(hex: string): string {
  let str = '';
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(Number.parseInt(hex.substr(i, 2), 16));
  }
  return str;
} 