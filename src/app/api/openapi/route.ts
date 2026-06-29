import { NextResponse } from 'next/server'

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Previando API',
    version: '1.0.0',
    description: 'API interna do Previando — sistema de cálculos previdenciários para advogados.',
    contact: { name: 'Suporte', email: 'contato@previando.com.br' },
  },
  servers: [{ url: '/api', description: 'API Previando' }],
  tags: [
    { name: 'auth', description: 'Autenticação e registro' },
    { name: 'clients', description: 'Gestão de clientes (segurados)' },
    { name: 'cases', description: 'Gestão de casos previdenciários' },
    { name: 'calculations', description: 'Cálculos de benefícios' },
    { name: 'cnis', description: 'Upload e processamento do CNIS' },
    { name: 'opinions', description: 'Pareceres gerados por IA' },
    { name: 'retroativos', description: 'Cálculo de valores retroativos' },
    { name: 'billing', description: 'Assinatura e pagamentos' },
    { name: 'dashboard', description: 'Métricas e resumos' },
    { name: 'portal', description: 'Portal do cliente (público)' },
    { name: 'export', description: 'Exportação de dados' },
    { name: 'onboarding', description: 'Progresso do onboarding' },
  ],
  paths: {
    // ── Auth ──────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['auth'],
        summary: 'Registrar novo usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuário criado com sucesso' },
          409: { description: 'Email já cadastrado' },
        },
      },
    },

    // ── Clients ───────────────────────────────────────────
    '/clients': {
      get: {
        tags: ['clients'],
        summary: 'Listar clientes do usuário',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Busca por nome' },
          { name: 'priority', in: 'query', schema: { type: 'string', enum: ['CRITICAL', 'ATTENTION', 'NORMAL'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Lista de clientes' } },
      },
      post: {
        tags: ['clients'],
        summary: 'Criar novo cliente',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'cpf', 'birthDate'],
                properties: {
                  name: { type: 'string' },
                  cpf: { type: 'string', description: 'CPF sem formatação (11 dígitos)' },
                  birthDate: { type: 'string', format: 'date' },
                  phone: { type: 'string' },
                  email: { type: 'string', format: 'email' },
                  priority: { type: 'string', enum: ['CRITICAL', 'ATTENTION', 'NORMAL'] },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cliente criado' },
          409: { description: 'CPF já cadastrado' },
        },
      },
    },
    '/clients/{id}': {
      get: {
        tags: ['clients'],
        summary: 'Buscar cliente por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Dados do cliente' }, 404: { description: 'Não encontrado' } },
      },
      put: {
        tags: ['clients'],
        summary: 'Atualizar cliente',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Cliente atualizado' } },
      },
      delete: {
        tags: ['clients'],
        summary: 'Deletar cliente',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Cliente deletado' } },
      },
    },

    // ── Cases ─────────────────────────────────────────────
    '/cases': {
      get: {
        tags: ['cases'],
        summary: 'Listar casos',
        responses: { 200: { description: 'Lista de casos' } },
      },
    },
    '/cases/{id}': {
      get: {
        tags: ['cases'],
        summary: 'Buscar caso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Dados do caso' } },
      },
      put: {
        tags: ['cases'],
        summary: 'Atualizar caso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Caso atualizado' } },
      },
      delete: {
        tags: ['cases'],
        summary: 'Deletar caso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Caso deletado' } },
      },
    },
    '/cases/{id}/status': {
      patch: {
        tags: ['cases'],
        summary: 'Atualizar status do caso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: {
                    type: 'string',
                    enum: ['PROSPECTING', 'ANALYSIS', 'READY_TO_REQUEST', 'PROCESSING', 'FINISHED'],
                  },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Status atualizado' } },
      },
    },

    // ── Calculations ──────────────────────────────────────
    '/cases/{id}/calculations': {
      get: {
        tags: ['calculations'],
        summary: 'Listar cálculos do caso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Lista de cálculos' } },
      },
      post: {
        tags: ['calculations'],
        summary: 'Executar novo cálculo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['modality'],
                properties: {
                  modality: { type: 'string', description: 'Modalidade de cálculo (ex: POINTS_86_96)' },
                  useManualParams: { type: 'boolean' },
                  manualParams: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Cálculo executado' },
          402: { description: 'Limite do plano atingido' },
        },
      },
    },

    // ── CNIS ──────────────────────────────────────────────
    '/cnis/upload': {
      post: {
        tags: ['cnis'],
        summary: 'Upload do CNIS (PDF)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  caseId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 202: { description: 'Upload aceito, processamento em fila' } },
      },
    },
    '/cnis/{caseId}/status': {
      get: {
        tags: ['cnis'],
        summary: 'Status do processamento do CNIS',
        parameters: [{ name: 'caseId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Status: PENDING | PROCESSING | COMPLETED | FAILED' } },
      },
    },

    // ── Opinions ──────────────────────────────────────────
    '/cases/{id}/opinions': {
      post: {
        tags: ['opinions'],
        summary: 'Gerar parecer com IA',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 201: { description: 'Parecer gerado' }, 402: { description: 'Limite do plano atingido' } },
      },
    },

    // ── Retroativos ───────────────────────────────────────
    '/cases/{id}/retroativos': {
      post: {
        tags: ['retroativos'],
        summary: 'Calcular valores retroativos',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entitlementStartDate', 'requestDate', 'correctionIndex'],
                properties: {
                  entitlementStartDate: { type: 'string', format: 'date' },
                  requestDate: { type: 'string', format: 'date' },
                  correctionIndex: { type: 'string', enum: ['INPC', 'SELIC', 'IPCA'] },
                  discountValue: { type: 'number' },
                  discountDescription: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Retroativo calculado' } },
      },
    },

    // ── Dashboard ─────────────────────────────────────────
    '/dashboard/summary': {
      get: {
        tags: ['dashboard'],
        summary: 'Resumo geral do escritório',
        responses: { 200: { description: 'Métricas: clientes, casos, cálculos, prazos' } },
      },
    },
    '/dashboard/insights': {
      get: {
        tags: ['dashboard'],
        summary: 'Insights acionáveis: receita potencial, alertas, uso do plano',
        responses: { 200: { description: 'Insights' } },
      },
    },

    // ── Billing / Webhooks ────────────────────────────────
    '/webhooks/mercadopago': {
      post: {
        tags: ['billing'],
        summary: 'Webhook do Mercado Pago (pagamentos)',
        responses: { 200: { description: 'Webhook processado' } },
      },
    },

    // ── Portal do Cliente ─────────────────────────────────
    '/cases/{id}/portal': {
      get: {
        tags: ['portal'],
        summary: 'Retorna o link compartilhável do caso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Link e data de expiração' } },
      },
      post: {
        tags: ['portal'],
        summary: 'Gera (ou renova) o link compartilhável',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 201: { description: 'Link gerado' } },
      },
      delete: {
        tags: ['portal'],
        summary: 'Revoga o link compartilhável',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Link revogado' } },
      },
    },
    '/portal/{token}': {
      get: {
        tags: ['portal'],
        summary: 'Dados públicos do caso via token (sem autenticação)',
        parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Dados do caso para o cliente' },
          404: { description: 'Token inválido' },
          410: { description: 'Token expirado' },
        },
      },
    },

    // ── Export ────────────────────────────────────────────
    '/export/data': {
      get: {
        tags: ['export'],
        summary: 'Exportar todos os dados do escritório em JSON',
        responses: {
          200: {
            description: 'Arquivo JSON com todos os dados',
            content: { 'application/json': {} },
          },
        },
      },
    },

    // ── Onboarding ────────────────────────────────────────
    '/onboarding/progress': {
      get: {
        tags: ['onboarding'],
        summary: 'Progresso do onboarding e detecção de primeiro login',
        responses: {
          200: {
            description: 'Progresso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    isFirstLogin: { type: 'boolean' },
                    hasClients: { type: 'boolean' },
                    hasCases: { type: 'boolean' },
                    hasCnis: { type: 'boolean' },
                    hasCalculation: { type: 'boolean' },
                    hasOpinion: { type: 'boolean' },
                    completedSteps: { type: 'integer' },
                    totalSteps: { type: 'integer' },
                    isComplete: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: { type: 'apiKey', in: 'cookie', name: 'next-auth.session-token' },
    },
  },
  security: [{ cookieAuth: [] }],
}

export async function GET() {
  return NextResponse.json(spec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
