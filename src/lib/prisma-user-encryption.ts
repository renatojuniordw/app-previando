import { Prisma } from '@prisma/client'
import { encrypt, decryptOrPlain } from './encryption'

// User.cpf é o CPF do próprio advogado (não do cliente do escritório — esse já
// é armazenado como HMAC em Client.cpfHash, irreversível). Aqui precisamos
// devolver o valor de volta para o dono editar seu perfil, então usamos
// criptografia simétrica reversível em vez de hash.
function encryptCpf<T extends Record<string, unknown>>(data: T): T {
  if (typeof data?.cpf !== 'string' || data.cpf.length === 0) return data
  return { ...data, cpf: encrypt(data.cpf) }
}

function decryptCpf<T>(record: T): T {
  if (!record || typeof record !== 'object') return record
  const out = { ...(record as Record<string, unknown>) }
  if (typeof out.cpf === 'string' && out.cpf.length > 0) {
    out.cpf = decryptOrPlain(out.cpf)
  }
  return out as T
}

// Exportado como função (não const avaliada no import) pelo mesmo motivo
// documentado em prisma-bpc-encryption.ts: `Prisma.defineExtension` lança
// quando este módulo entra no bundle do Edge Runtime (middleware).
export function getUserCpfEncryptionExtension() {
  return Prisma.defineExtension({
  name: 'user-cpf-encryption',
  query: {
    user: {
      async create({ args, query }) {
        if (args.data) args.data = encryptCpf(args.data)
        return decryptCpf(await query(args))
      },
      async update({ args, query }) {
        if (args.data) args.data = encryptCpf(args.data)
        return decryptCpf(await query(args))
      },
      async upsert({ args, query }) {
        if (args.create) args.create = encryptCpf(args.create)
        if (args.update) args.update = encryptCpf(args.update)
        return decryptCpf(await query(args))
      },
      async findUnique({ args, query }) {
        return decryptCpf(await query(args))
      },
      async findUniqueOrThrow({ args, query }) {
        return decryptCpf(await query(args))
      },
      async findFirst({ args, query }) {
        return decryptCpf(await query(args))
      },
      async findMany({ args, query }) {
        const results = await query(args)
        return results.map((r) => decryptCpf(r))
      },
    },
  },
  })
}
