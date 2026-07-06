const isDev = process.env.NODE_ENV === 'development'

/**
 * CSP com nonce por requisição em vez de `'unsafe-inline'` em script-src.
 * 'unsafe-inline' na prática desliga a principal proteção da CSP contra XSS
 * (qualquer <script> injetado passa). O nonce só libera os scripts que o
 * próprio Next.js gerou nesta resposta específica.
 *
 * Precisa ser montada por requisição (não em next.config.mjs, que é estático)
 * — por isso vive no middleware, a única camada que roda antes de toda
 * resposta de página.
 */
export function buildCSP(nonce: string): string {
  return [
    "default-src 'self'",
    // 'wasm-unsafe-eval' é necessário mesmo em produção: @react-pdf/renderer usa
    // yoga-layout (WASM) para o layout dos PDFs (BPC, casos, comparativos etc).
    isDev
      ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'wasm-unsafe-eval'`,
    // style-src mantém 'unsafe-inline': Tailwind/MUI geram estilos inline em runtime
    // e não há suporte prático a nonce para <style> nesses stacks sem reescrever o CSS-in-JS.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://images.unsplash.com https://lh3.googleusercontent.com",
    "font-src 'self'",
    isDev
      ? "connect-src 'self' data: ws: wss: https://*.r2.cloudflarestorage.com"
      : "connect-src 'self' data: https://*.r2.cloudflarestorage.com",
    "frame-src 'self' blob:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}
