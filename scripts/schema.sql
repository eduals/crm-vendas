-- Criação das tabelas para o sistema de gerenciamento imobiliário

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(255),
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de imóveis
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  address VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  area NUMERIC(10, 2) NOT NULL,
  price NUMERIC(15, 2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'Disponível',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de corretores
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  license_number VARCHAR(50) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  agency VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de visitas
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  agent_id INTEGER NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  client_email VARCHAR(100),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'Agendada',
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_date ON visits(scheduled_date);

-- Inserir dados iniciais para usuário admin
INSERT INTO users (name, email, password, role)
VALUES ('Admin', 'admin@imobiliaria.com', '$2a$10$JrJq9XdQ5K0F1Xz7r5X5l.GZkZ5J5X5X5X5X5X5X5X5X5X5X5X5X5', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Inserir alguns dados de exemplo para imóveis
INSERT INTO properties (code, address, type, area, price, description, status)
VALUES 
  ('AP001', 'Rua das Flores, 123 - Jardim Primavera', 'Apartamento', 85, 450000, 'Apartamento com 2 quartos, sala ampla, cozinha planejada e 1 vaga de garagem.', 'Disponível'),
  ('CS002', 'Av. Principal, 456 - Centro', 'Casa', 120, 650000, 'Casa com 3 quartos (1 suíte), sala de estar e jantar, cozinha, área de serviço e 2 vagas de garagem.', 'Disponível'),
  ('AP003', 'Rua dos Ipês, 789 - Vila Nova', 'Apartamento', 65, 320000, 'Apartamento com 1 quarto, sala, cozinha americana e 1 vaga de garagem.', 'Disponível')
ON CONFLICT (code) DO NOTHING;

-- Inserir alguns dados de exemplo para corretores
INSERT INTO agents (name, license_number, phone, email, agency, is_active)
VALUES 
  ('Carlos Silva', 'CRECI 12345', '(11) 98765-4321', 'carlos.silva@imobiliaria.com', 'Imobiliária Central', true),
  ('Ana Beatriz', 'CRECI 23456', '(11) 97654-3210', 'ana.beatriz@imobiliaria.com', 'Imóveis Premium', true),
  ('Roberto Almeida', 'CRECI 34567', '(11) 96543-2109', 'roberto.almeida@imobiliaria.com', 'Imobiliária Central', true)
ON CONFLICT (license_number) DO NOTHING;

