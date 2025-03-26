/**
 * Script para testar criptografia e descriptografia com caracteres especiais
 * Rode com: node scripts/test-crypto.js
 */

// Importar a biblioteca CryptoJS
const CryptoJS = require('crypto-js');

// Chave de teste
const KEY = "chave_de_teste_1234567890";

// Função de teste de criptografia e descriptografia
function testCrypto(text, description) {
  console.log(`\n=== Teste com "${description}" ===`);
  console.log(`Texto original: "${text}"`);

  try {
    // Método 1: JSON.stringify + AES direto
    console.log("\n[Método 1] JSON.stringify + AES direto:");
    
    // Criptografar
    const method1Data = JSON.stringify({ text });
    const method1Encrypted = CryptoJS.AES.encrypt(method1Data, KEY).toString();
    console.log(`Criptografado (${method1Encrypted.length} bytes): ${method1Encrypted.substring(0, 40)}...`);
    
    // Descriptografar
    const method1Bytes = CryptoJS.AES.decrypt(method1Encrypted, KEY);
    const method1Decrypted = method1Bytes.toString(CryptoJS.enc.Utf8);
    const method1Result = JSON.parse(method1Decrypted).text;
    console.log(`Descriptografado: "${method1Result}"`);
    console.log(`Sucesso: ${method1Result === text}`);
    
  } catch (method1Error) {
    console.error(`[Método 1] Erro: ${method1Error.message}`);
  }

  try {
    // Método 2: Base64 + AES
    console.log("\n[Método 2] Base64 + AES:");
    
    // Criptografar
    const method2Data = Buffer.from(JSON.stringify({ text })).toString('base64');
    const method2Encrypted = CryptoJS.AES.encrypt(method2Data, KEY).toString();
    console.log(`Criptografado (${method2Encrypted.length} bytes): ${method2Encrypted.substring(0, 40)}...`);
    
    // Descriptografar
    const method2Bytes = CryptoJS.AES.decrypt(method2Encrypted, KEY);
    const method2Base64 = method2Bytes.toString(CryptoJS.enc.Utf8);
    const method2JSON = Buffer.from(method2Base64, 'base64').toString('utf8');
    const method2Result = JSON.parse(method2JSON).text;
    console.log(`Descriptografado: "${method2Result}"`);
    console.log(`Sucesso: ${method2Result === text}`);
    
  } catch (method2Error) {
    console.error(`[Método 2] Erro: ${method2Error.message}`);
  }
}

// Executar testes com diferentes tipos de texto
console.log("TESTES DE CRIPTOGRAFIA COM CARACTERES ESPECIAIS");
console.log("===============================================");

// Teste 1: Texto simples em português
testCrypto("Olá, mundo!", "texto com acento");

// Teste 2: Texto com caracteres especiais e acentos variados
testCrypto("João não é José, nem é Françoise. Ele é açaí e camarão.", "texto com muitos acentos");

// Teste 3: Texto com emojis
testCrypto("😀 Vamos à praia! 🏖️", "texto com emojis");

// Teste 4: Objeto complexo com dados de visita
testCrypto(
  JSON.stringify({
    client_name: "José da Silva",
    client_phone: "(11) 98765-4321",
    client_email: "jose@example.com",
    scheduled_date: "2023-01-15",
    scheduled_time: "14:30:00",
    status: "Agendada",
    property_id: 123,
    agent_id: 456,
    feedback: "Cliente está muito interessado no imóvel próximo à estação."
  }),
  "objeto JSON com dados de visita"
);

console.log("\n=== Testes concluídos ==="); 