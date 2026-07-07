import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get('cep')
  if (!cep || cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido.' }, { status: 400 })
  }

  const r = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(5000) })
  const data = await r.json()

  if (data.erro) {
    return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({
    street: data.logradouro ?? '',
    neighborhood: data.bairro ?? '',
    city: data.localidade ?? '',
    state: data.uf ?? '',
  })
}
