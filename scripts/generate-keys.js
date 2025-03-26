/**
 * Script para gerar chaves de criptografia seguras
 * Rode com: node scripts/generate-keys.js
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Gerar uma chave aleatória e segura (aumentando para 64 bytes para maior segurança)
function generateSecureKey(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

// Caminho para o arquivo .env
const envPath = path.join(process.cwd(), '.env');

try {
  console.log('Gerando nova chave de criptografia segura...');
  
  // Gerar uma única chave que será usada tanto no cliente quanto no servidor
  // Uma chave única é importante pois o algoritmo AES precisa da mesma chave para encriptar/decriptar
  const sharedKey = generateSecureKey();
  
  console.log('\nChave gerada com sucesso:');
  console.log(`NEXT_PUBLIC_ENCRYPTION_KEY=${sharedKey}`);
  console.log(`ENCRYPTION_KEY=${sharedKey}`);
  
  // Ler o conteúdo atual do .env
  let envContent = '';
  try {
    envContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    console.log('Arquivo .env não encontrado. Será criado um novo.');
  }
  
  // Substituir as chaves existentes ou adicionar novas
  // Importante: ambas as chaves devem ter o mesmo valor
  let updatedContent = envContent;
  
  // Substituir ou adicionar NEXT_PUBLIC_ENCRYPTION_KEY
  if (envContent.includes('NEXT_PUBLIC_ENCRYPTION_KEY=')) {
    updatedContent = updatedContent.replace(/NEXT_PUBLIC_ENCRYPTION_KEY=.*$/m, `NEXT_PUBLIC_ENCRYPTION_KEY=${sharedKey}`);
  } else {
    updatedContent += `\nNEXT_PUBLIC_ENCRYPTION_KEY=${sharedKey}`;
  }
  
  // Substituir ou adicionar ENCRYPTION_KEY
  if (updatedContent.includes('ENCRYPTION_KEY=')) {
    updatedContent = updatedContent.replace(/ENCRYPTION_KEY=.*$/m, `ENCRYPTION_KEY=${sharedKey}`);
  } else {
    updatedContent += `\nENCRYPTION_KEY=${sharedKey}`;
  }
  
  // Salvar as alterações
  fs.writeFileSync(envPath, updatedContent);
  
  console.log('\nArquivo .env atualizado com sucesso!');
  console.log('\nIMPORTANTE: Reinicie o servidor para aplicar as alterações.');
  
} catch (error) {
  console.error('Erro ao gerar ou salvar as chaves:', error);
} 