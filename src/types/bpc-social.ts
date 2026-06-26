export interface SocialItem {
  pergunta: string
  resposta: string
}

export interface SocialDominio {
  id: string
  categoria: string
  titulo: string
  aspectosRelevantes: string
  lacunas: string
  itens: SocialItem[]
}

export interface RelatoSocial {
  dominios: SocialDominio[]
}

// Formato que a IA retorna antes de converter perguntas -> itens
export interface SocialDominioFromAI {
  id: string
  categoria: string
  titulo: string
  aspectosRelevantes: string
  lacunas: string
  perguntas: string[]
}

export interface RelatoSocialFromAI {
  dominios: SocialDominioFromAI[]
}
