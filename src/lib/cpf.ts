// Validação de dígito verificador de CPF (algoritmo oficial da Receita Federal).
// Sem isso, qualquer sequência de 11 dígitos era aceita como CPF válido.
export function isValidCPF(value: string): boolean {
  const cpf = value.replace(/\D/g, '')

  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false // todos os dígitos iguais (000..., 111..., etc.)

  const digits = cpf.split('').map(Number)

  const checkDigit = (length: number): number => {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i)
    }
    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10]
}
