# SanzonyZap CRM

CRM profissional de multiatendimento via WhatsApp, integrado com [Evolution API](https://doc.evolution-api.com).

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + React 19 |
| Estilização | CSS Vanilla (BEM) + CSS Variables |
| Estado | Zustand (persistência LocalStorage) |
| Backend | Next.js API Routes |
| ORM | Prisma 7 + SQLite (dev) |
| Auth | JWT + bcryptjs |
| Integração | Evolution API v2 REST |

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 3. Gerar cliente Prisma
npx prisma generate

# 4. Criar banco de dados
npx prisma migrate dev --name init

# 5. Popular dados iniciais
npm run db:seed

# 6. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

## Credenciais Padrão

| Cargo | E-mail | Senha |
|---|---|---|
| Admin | admin@crm.com | admin123 |
| Atendente | atendente@crm.com | atendente123 |
| Supervisor | supervisor@crm.com | supervisor123 |

## Funcionalidades

- **Painel de Atendimento**: Chat estilo WhatsApp Web com filtros e busca
- **Funil de Vendas**: Pipeline Kanban com drag-and-drop
- **Gestão de Clientes**: Cadastro automático, notas internas, histórico
- **Automações**: Boas-vindas, palavras-chave, fora do horário
- **Dashboard**: Métricas em tempo real e gráficos
- **Multi-atendimento**: Distribuição round-robin, transferência
- **Dark Mode**: Tema escuro/claro persistente
- **Integração WhatsApp**: Envio/recebimento via Evolution API

## Scripts

```bash
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm run db:seed    # Popular banco com dados de exemplo
npm run db:studio  # Interface visual do banco (Prisma Studio)
```

## Licença

Projeto privado — Sanzony Voz
