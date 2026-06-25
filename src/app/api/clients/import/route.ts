import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hashCPF, sanitizeInput, sanitizePhone } from '@/lib/sanitize'
import { guardClientLimit } from '@/lib/plan-guard'
import { handleApiError } from '@/lib/api-error'
import { rateLimit } from '@/lib/rate-limit'

// Formato CSV esperado:
// nome,cpf,data_nascimento,telefone,email,prioridade,notas
// NORMAL|ATTENTION|CRITICAL para prioridade; data_nascimento: YYYY-MM-DD ou DD/MM/YYYY

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseBirthDate(raw: string): Date | null {
  const cleaned = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    const d = new Date(cleaned + 'T00:00:00Z')
    return isNaN(d.getTime()) ? null : d
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(cleaned)) {
    const [day, month, year] = cleaned.split('/')
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

    const { success } = await rateLimit(`csv-import:${session.user.id}`, 3, 3600)
    if (!success) return NextResponse.json({ error: 'Limite de importações excedido. Tente novamente em 1 hora.' }, { status: 429 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo CSV não enviado.' }, { status: 400 })

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2MB.' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV vazio ou sem dados.' }, { status: 400 })
    }

    const results: { row: number; status: 'created' | 'duplicate' | 'error'; message?: string }[] = []
    let created = 0

    // Pula cabeçalho (linha 0)
    for (let i = 1; i < Math.min(lines.length, 501); i++) {
      const cols = parseCsvLine(lines[i])
      const [rawName, rawCpf, rawBirth, rawPhone, rawEmail, rawPriority] = cols

      if (!rawName || !rawCpf || !rawBirth) {
        results.push({ row: i + 1, status: 'error', message: 'Nome, CPF e data de nascimento são obrigatórios.' })
        continue
      }

      const birthDate = parseBirthDate(rawBirth)
      if (!birthDate) {
        results.push({ row: i + 1, status: 'error', message: `Data de nascimento inválida: ${rawBirth}` })
        continue
      }

      let cpfHash: string
      try {
        cpfHash = hashCPF(rawCpf)
      } catch {
        results.push({ row: i + 1, status: 'error', message: 'CPF inválido.' })
        continue
      }

      const existing = await prisma.client.findFirst({
        where: { userId: session.user.id, cpfHash },
        select: { id: true },
      })
      if (existing) {
        results.push({ row: i + 1, status: 'duplicate', message: 'CPF já cadastrado.' })
        continue
      }

      try {
        await guardClientLimit(session.user.id, session.user.plan)
      } catch {
        results.push({ row: i + 1, status: 'error', message: 'Limite de clientes do plano atingido.' })
        break
      }

      const priority = ['CRITICAL', 'ATTENTION', 'NORMAL'].includes((rawPriority ?? '').toUpperCase())
        ? (rawPriority.toUpperCase() as 'CRITICAL' | 'ATTENTION' | 'NORMAL')
        : 'NORMAL'

      await prisma.client.create({
        data: {
          userId: session.user.id,
          name: sanitizeInput(rawName),
          cpfHash,
          birthDate,
          phone: rawPhone ? sanitizePhone(rawPhone) : null,
          email: rawEmail?.includes('@') ? rawEmail.trim().toLowerCase() : null,
          priority,
        },
      })

      created++
      results.push({ row: i + 1, status: 'created' })
    }

    if (created > 0) {
      await prisma.usageRecord.upsert({
        where: { userId: session.user.id },
        update: { totalClients: { increment: created } },
        create: { userId: session.user.id, totalClients: created },
      })
    }

    return NextResponse.json({ created, total: lines.length - 1, results })
  } catch (err) {
    return handleApiError(err)
  }
}
