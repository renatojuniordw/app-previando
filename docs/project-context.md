# Documentação de Contexto e Arquitetura - Previando App

Este documento visa fornecer um panorama geral da arquitetura, bibliotecas e estrutura do projeto para auxiliar agentes de IA no entendimento do contexto e na navegação do código.

## 1. Visão Geral da Arquitetura
O projeto é uma aplicação web Full-Stack baseada em **Next.js (App Router)**, desenvolvida para gerenciar casos previdenciários (cálculos, benefícios, simulações, BPC e CNIS). A arquitetura segue padrões modernos de desenvolvimento React, com forte tipagem utilizando **TypeScript**.

### Principais Padrões e Componentes:
- **Frontend**: Next.js App Router (Páginas em `src/app`, componentes na pasta `src/components`). Uso intensivo de Server Components e Client Components onde necessário.
- **Backend / API**: Rotas de API implementadas em `src/app/api/...`. A aplicação serve tanto a interface gráfica quanto as lógicas de negócio integradas.
- **Banco de Dados**: Gerenciado via **Prisma ORM**, utilizando PostgreSQL (presumivelmente).
- **Filas e Processamento Assíncrono**: Utilização de **BullMQ** com **Redis** para tarefas pesadas que não devem bloquear o ciclo de requisição/resposta (ex: processamento de PDFs longos do CNIS). Existe um Worker (`src/jobs/worker.ts`) rodando paralelamente.
- **Estilização**: **Tailwind CSS** com integração do `clsx` e `tailwind-merge` para componentes de UI reutilizáveis (no padrão inspirado em shadcn/ui).
- **Autenticação**: **NextAuth.js** (versão 5.0 beta) em conjunto com o adaptador do Prisma para lidar com o login e sessão de usuários.
- **Integração com IA**: Uso direto da SDK do **OpenAI** para extração de dados, relatórios e análises jurídicas/previdenciárias (ex: pre-analysis, laudos, análise social e médica para BPC).

## 2. Principais Bibliotecas e Tecnologias

Abaixo estão listadas as bibliotecas mais relevantes presentes no `package.json`:

### Core e Framework:
- `next` (^14.2): Framework base com App Router.
- `react` e `react-dom` (^18.3.1): Bibliotecas de interface.
- `typescript`: Tipagem estática em toda a base de código.

### Banco de Dados e ORM:
- `@prisma/client` e `prisma` (^5.22): ORM principal.

### Autenticação e Segurança:
- `next-auth` (^5.0.0-beta.25): Gerenciamento de sessões e logins.
- `@auth/prisma-adapter`: Adaptador do NextAuth para gravar sessões/usuários via Prisma.
- `bcryptjs`: Hashing de senhas.

### Processamento e Filas (Background Jobs):
- `bullmq` (^5.23) e `ioredis`: Gerenciamento de filas para processamento pesado assíncrono.

### Manipulação de Arquivos e IA:
- `openai` (^4.73): Integração com modelos GPT.
- `@aws-sdk/client-s3`: Armazenamento de arquivos estáticos/uploads.
- `pdf-parse`, `pdfkit`, `@react-pdf/renderer`, `@ag-media/react-pdf-table`: Manipulação, extração de texto e geração de PDFs.
- `tesseract.js`: OCR para extração de dados de imagens.

### Utilitários e UI:
- `tailwindcss`, `clsx`, `tailwind-merge`: Sistema de estilização.
- `lucide-react`: Biblioteca de ícones.
- `react-hook-form` e `zod`: Validação e gerenciamento de formulários.
- `zustand`: Gerenciamento de estado global no client-side.
- `date-fns`: Manipulação e formatação de datas.
- `recharts`: Gráficos (Dashboard/Métricas).
- `@dnd-kit/core`: Drag-and-drop, provavelmente utilizado no quadro Kanban de clientes.

### Pagamentos:
- `mercadopago`: Integração com gateway de pagamento.

## 3. Estrutura de Diretórios (Árvore Principal)

```text
├── prisma/                 # Schema do banco de dados e migrations
├── public/                 # Assets públicos estáticos
├── docs/                   # Documentação do projeto (este arquivo)
└── src/
    ├── app/                # Next.js App Router (Páginas e API)
    │   ├── (auth)/         # Telas públicas de Autenticação (login, register)
    │   ├── (dashboard)/    # Telas restritas do sistema principal
    │   │   ├── activity/   # Histórico de atividades do usuário
    │   │   ├── cases/      # Gerenciamento profundo de Casos (CNIS, Simulador, BPC, Cálculos)
    │   │   ├── clients/    # Listagem de clientes (Lista, Kanban)
    │   │   ├── dashboard/  # Tela principal e métricas do cliente
    │   │   ├── deadlines/  # Prazos e calendários
    │   │   ├── settings/   # Configurações do usuário/faturamento
    │   │   └── tools/      # Ferramentas auxiliares
    │   ├── admin/          # Área restrita a Administradores (Métricas, Planos, Usuários)
    │   └── api/            # Endpoints do Backend
    │       ├── admin/      # API Restrita de administração
    │       ├── auth/       # API do NextAuth
    │       ├── cases/      # CRUD e ações complexas sobre Casos
    │       ├── cnis/       # Upload e processamento do extrato CNIS
    │       ├── webhooks/   # Recebimento de Webhooks (ex: mercadopago)
    │       └── ...         # Outras APIs (clients, dashboard, export, etc)
    ├── components/         # Componentes React reutilizáveis
    │   ├── ui/             # Componentes base (Botões, Inputs, Modais - padrão shadcn)
    │   ├── cases/          # Componentes específicos da view de casos
    │   ├── bpc/            # Componentes específicos de BPC
    │   └── ...
    ├── hooks/              # Custom React Hooks
    ├── jobs/               # Arquivos e workers do BullMQ (ex: worker.ts)
    ├── lib/                # Funções utilitárias globais (utils.ts, instâncias DB, etc)
    │   └── prompts/        # Prompts estruturados enviados para a OpenAI
    ├── services/           # Lógica de negócio isolada (serviços)
    │   ├── bpc/            # Serviços de processamento do BPC
    │   ├── cnis/           # Lógica pesada do parser de CNIS
    │   └── previdencia/    # Cálculos previdenciários centrais
    └── store/              # Stores do Zustand (Estado Global)
```

## Recomendações para Agentes (IAs)
- **Localização Rápida de Lógica:** Se precisar alterar lógicas de negócio pesadas, cálculos e integrações externas (OpenAI), busque primeiro na pasta `src/services` ou `src/lib`.
- **Roteamento de Casos Específicos:** Funcionalidades de interface de Casos ficam em `src/app/(dashboard)/cases/[id]/...`. A API de backend correspondente está em `src/app/api/cases/[id]/...`.
- **Padrão de Autenticação:** Ao criar novos endpoints sensíveis, lembre-se de validar a sessão usando NextAuth.
- **Processos Lentos:** Qualquer processamento que exceda os limites da API Serverless ou demore mais de poucos segundos deve ser delegado para as filas do BullMQ (`src/jobs`).
