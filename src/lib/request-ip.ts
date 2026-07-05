/**
 * Extrai o IP do cliente para rate limiting e auditoria.
 *
 * `cf-connecting-ip` é definido pela borda da Cloudflare e sobrescreve
 * qualquer valor que o cliente tente enviar com esse mesmo nome — por isso é
 * a fonte preferida quando o tráfego passa por ela.
 *
 * Em `x-forwarded-for`, o primeiro valor da lista é o que o cliente informou
 * originalmente (então é o mais fácil de forjar); cada proxy no caminho
 * *anexa* o IP de quem lhe enviou a requisição. Por isso usamos o ÚLTIMO
 * valor da lista — o hop mais próximo do nosso servidor — em vez do primeiro.
 * Isso não é infalível sem uma lista fixa de proxies confiáveis, mas é
 * significativamente mais difícil de forjar do que aceitar o primeiro valor.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const parts = forwardedFor.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length > 0) return parts[parts.length - 1]
  }

  return 'unknown'
}
