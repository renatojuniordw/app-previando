import { Prisma } from '@prisma/client'
import { encrypt, decryptOrPlain } from './encryption'

// Dados de saúde e vulnerabilidade social são "dados sensíveis" nos termos do
// art. 5º, II da LGPD — o maior risco do sistema em caso de vazamento do banco.
// Criptografamos em repouso de forma transparente para o resto da aplicação:
// toda leitura/escrita em BpcAnalysis passa por aqui, então nenhuma rota,
// serviço de IA ou gerador de PDF precisa saber que o dado está cifrado.
const ENCRYPTED_FIELDS = [
  'patologia',
  'cid',
  'barreiras',
  'resumoLaudos',
  'preAnalise',
  'analiseLaudo',
  'perguntasSocial',
  'perguntasMedicas',
  'checklist',
] as const

type EncryptedField = (typeof ENCRYPTED_FIELDS)[number]

function encryptFields<T extends Record<string, unknown>>(data: T): T {
  const out = { ...data } as Record<string, unknown>
  for (const field of ENCRYPTED_FIELDS) {
    const value = out[field]
    if (typeof value === 'string' && value.length > 0) {
      out[field] = encrypt(value)
    }
  }
  return out as T
}

function decryptFields<T>(record: T): T {
  if (!record || typeof record !== 'object') return record
  const out = { ...(record as Record<string, unknown>) }
  for (const field of ENCRYPTED_FIELDS) {
    const value = out[field as EncryptedField]
    if (typeof value === 'string' && value.length > 0) {
      out[field as EncryptedField] = decryptOrPlain(value)
    }
  }
  return out as T
}

// Exportado como função (em vez de const avaliada no import) porque
// `Prisma.defineExtension` lança em tempo de execução quando o módulo é
// resolvido para o build "browser" do @prisma/client — o que acontece quando
// este arquivo entra no bundle do Edge Runtime (via src/auth.config.ts no
// middleware). Mantendo a chamada dentro de uma função, ela só executa quando
// alguém de fato invoca getBpcEncryptionExtension() — ver src/lib/prisma.ts.
export function getBpcEncryptionExtension() {
  return Prisma.defineExtension({
  name: 'bpc-field-encryption',
  query: {
    bpcAnalysis: {
      async create({ args, query }) {
        if (args.data) args.data = encryptFields(args.data)
        return decryptFields(await query(args))
      },
      async update({ args, query }) {
        if (args.data) args.data = encryptFields(args.data)
        return decryptFields(await query(args))
      },
      async upsert({ args, query }) {
        if (args.create) args.create = encryptFields(args.create)
        if (args.update) args.update = encryptFields(args.update)
        return decryptFields(await query(args))
      },
      async findUnique({ args, query }) {
        return decryptFields(await query(args))
      },
      async findUniqueOrThrow({ args, query }) {
        return decryptFields(await query(args))
      },
      async findFirst({ args, query }) {
        return decryptFields(await query(args))
      },
      async findMany({ args, query }) {
        const results = await query(args)
        return results.map((r) => decryptFields(r))
      },
    },
  },
  })
}
