import NextAuth from 'next-auth'
import { authConfig } from '@/auth.config'

// Instância "edge-safe" do NextAuth, usada exclusivamente pelo middleware
// (Edge Runtime). Só precisa decodificar a sessão JWT já emitida — nunca
// autentica ninguém (não há sign-in em middleware) — por isso não precisa
// de providers reais nem do adapter do Prisma. Isso mantém `ioredis`,
// `bcryptjs` e a lógica de autorização de credenciais fora do bundle do
// Edge Runtime, que não suporta os módulos Node-only do `ioredis`.
export const { auth } = NextAuth({
  ...authConfig,
  providers: [],
})
