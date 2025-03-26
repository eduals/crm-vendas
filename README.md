# CRM Vendas

Sistema de gerenciamento de vendas e visitas imobiliárias. Uma aplicação completa para corretores e imobiliárias gerenciarem seus clientes, propriedades e agendamentos de visitas.

## Características

- Dashboard com métricas e visão geral do negócio
- Gerenciamento de propriedades
- Cadastro e gerenciamento de corretores
- Agendamento e acompanhamento de visitas
- Autenticação com Clerk
- Design responsivo e moderno

## Tecnologias

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Clerk Auth
- PostgreSQL
- Node.js

## Começando

### Pré-requisitos

- Node.js 20+
- npm
- PostgreSQL

### Instalação

1. Clone o repositório
   ```bash
   git clone https://github.com/eduals/crm-vendas.git
   cd crm-vendas
   ```

2. Instale as dependências
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente
   Crie um arquivo `.env.local` baseado no `.env.example`

4. Inicie o servidor de desenvolvimento
   ```bash
   npm run dev
   ```

### Docker

Para executar com Docker:

```bash
docker build -t crm-vendas .
docker run -p 3000:3000 crm-vendas
```

## Licença

Este projeto está licenciado sob a [Licença MIT](LICENSE). 