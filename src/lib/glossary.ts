export interface GlossaryEntry {
  term: string
  abbreviation?: string
  definition: string
  category: 'benefício' | 'conceito' | 'documento' | 'processo' | 'cálculo'
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: 'RMI',
    definition: 'Renda Mensal Inicial. É o valor que o segurado receberá no primeiro mês do benefício, calculado com base na média dos salários de contribuição.',
    category: 'cálculo',
  },
  {
    term: 'RMA',
    definition: 'Renda Mensal Atual. É o valor atualizado do benefício, já considerando os reajustes anuais aplicados desde a concessão.',
    category: 'cálculo',
  },
  {
    term: 'DIB',
    definition: 'Data de Início do Benefício. É a data a partir da qual o beneficiário passa a ter direito ao recebimento do benefício.',
    category: 'processo',
  },
  {
    term: 'DIP',
    definition: 'Data de Início do Pagamento. É a data em que o INSS começa efetivamente a pagar o benefício ao segurado.',
    category: 'processo',
  },
  {
    term: 'CNIS',
    definition: 'Cadastro Nacional de Informações Sociais. É o registro eletrônico que contém todo o histórico de contribuições do trabalhador para o INSS.',
    category: 'documento',
  },
  {
    term: 'INSS',
    definition: 'Instituto Nacional do Seguro Social. É o órgão federal responsável pelo pagamento dos benefícios previdenciários e assistenciais no Brasil.',
    category: 'conceito',
  },
  {
    term: 'Salário de Contribuição',
    definition: 'É o valor sobre o qual o trabalhador contribui para o INSS. Serve como base para o cálculo do valor dos benefícios.',
    category: 'cálculo',
  },
  {
    term: 'Tempo de Contribuição',
    definition: 'É o período total em que o trabalhador contribuiu para o INSS. Quanto maior o tempo, melhor tende a ser o valor do benefício.',
    category: 'conceito',
  },
  {
    term: 'Carência',
    definition: 'É o número mínimo de contribuições mensais exigido para ter direito a um benefício. Para aposentadoria, são necessárias 180 contribuições (15 anos).',
    category: 'conceito',
  },
  {
    term: 'BPC/LOAS',
    definition: 'Benefício de Prestação Continuada, previsto na Lei Orgânica da Assistência Social. É um benefício assistencial de um salário mínimo pago a idosos (65+) e pessoas com deficiência em situação de vulnerabilidade.',
    category: 'benefício',
  },
  {
    term: 'Aposentadoria por Idade',
    definition: 'Benefício concedido ao trabalhador que atinge a idade mínima (65 anos homem, 62 anos mulher) e cumpre a carência de 180 contribuições.',
    category: 'benefício',
  },
  {
    term: 'Aposentadoria por Tempo de Contribuição',
    definition: 'Benefício concedido ao trabalhador que completa o tempo mínimo de contribuição (35 anos homem, 30 anos mulher), sem exigência de idade mínima (regra anterior à reforma).',
    category: 'benefício',
  },
  {
    term: 'Aposentadoria Especial',
    definition: 'Benefício concedido ao trabalhador que exerce atividades com exposição a agentes nocivos à saúde (ruído, calor, agentes químicos), com tempo reduzido (15, 20 ou 25 anos).',
    category: 'benefício',
  },
  {
    term: 'Aposentadoria por Pontos',
    definition: 'Regra de transição que soma a idade ao tempo de contribuição. Atualmente exige 86 pontos para mulheres e 96 para homens.',
    category: 'benefício',
  },
  {
    term: 'Pedágio 50%',
    definition: 'Regra de transição para quem estava perto de se aposentar na reforma. Exige cumprir 50% a mais do tempo que faltava na data da reforma (13/11/2019).',
    category: 'benefício',
  },
  {
    term: 'Pedágio 100%',
    definition: 'Regra de transição que exige cumprir 100% a mais do tempo que faltava para se aposentar na data da reforma, sem idade mínima.',
    category: 'benefício',
  },
  {
    term: 'Auxílio-Doença (B31)',
    definition: 'Benefício pago ao trabalhador que fica temporariamente incapaz para o trabalho por motivo de doença ou acidente não relacionado ao trabalho.',
    category: 'benefício',
  },
  {
    term: 'Auxílio-Doença Acidentário (B91)',
    definition: 'Benefício pago ao trabalhador que fica incapacitado devido a acidente de trabalho ou doença ocupacional.',
    category: 'benefício',
  },
  {
    term: 'Pensão por Morte',
    definition: 'Benefício pago aos dependentes do segurado do INSS que falece. O valor depende da quantidade de dependentes e do tipo de aposentadoria que o falecido recebia.',
    category: 'benefício',
  },
  {
    term: 'Salário-Maternidade',
    definition: 'Benefício pago à segurada gestante durante 120 dias de afastamento do trabalho, podendo ser estendido em casos específicos.',
    category: 'benefício',
  },
  {
    term: 'Auxílio-Reclusão',
    definition: 'Benefício pago aos dependentes do segurado que está preso em regime fechado, desde que ele não receba salário nem benefício durante a prisão.',
    category: 'benefício',
  },
  {
    term: 'Aposentadoria Híbrida',
    definition: 'Benefício que combina tempo de contribuição urbano com tempo de trabalho rural, para quem trabalhou em ambos os regimes.',
    category: 'benefício',
  },
  {
    term: 'Retroativos',
    definition: 'Valores que o INSS deve pagar ao segurado referentes ao período entre o pedido do benefício e a data da concessão, com correção monetária.',
    category: 'cálculo',
  },
  {
    term: 'Fator Previdenciário',
    definition: 'Fórmula matemática que considera idade, tempo de contribuição e expectativa de vida para calcular o valor da aposentadoria. Pode reduzir ou aumentar o valor.',
    category: 'cálculo',
  },
  {
    term: 'DataJud',
    definition: 'Sistema do Conselho Nacional de Justiça (CNJ) que reúne dados públicos de processos judiciais de todo o Brasil.',
    category: 'processo',
  },
  {
    term: 'Perícia Médica',
    definition: 'Avaliação realizada por médico perito do INSS para verificar a existência de incapacidade para o trabalho, necessária para auxílio-doença e aposentadoria especial.',
    category: 'processo',
  },
  {
    term: 'Justiça Gratuita',
    definition: 'Direito garantido àqueles que não têm condições financeiras de pagar custas processuais e honorários de advogado sem prejudicar o sustento próprio ou da família.',
    category: 'processo',
  },
  {
    term: 'Revisão de Benefício',
    definition: 'Procedimento para reavaliar o valor de um benefício já concedido, quando se identifica erro de cálculo ou direito a uma regra mais vantajosa.',
    category: 'processo',
  },
]
