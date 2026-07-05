export const maskCPF = (cpf?: string) => {
  if (!cpf) return '***.***.**-**'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return '***.***.**-**'
  return `${digits.slice(0, 3)}.***.${digits.slice(6, 9)}-**`
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, '').slice(0, 13)
}

export function sanitizeForAI(input: string, maxLength: number = 3000): string {
  return input
    .replace(/---/g, '')
    .replace(/```/g, '')
    .replace(/ignore (previous|all) instructions/gi, '')
    .replace(/you are now|act as|pretend (you are|to be)|jailbreak/gi, '')
    .replace(/\[?(SYSTEM PROMPT|INST|im_start|im_end)\]?/gi, '')
    .replace(/\b(DAN|roleplay|superior model|unlocked)\b/gi, '')
    .replace(/\\u00[0-9a-f]{2}/gi, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ')
    .slice(0, maxLength)
    .trim()
}
