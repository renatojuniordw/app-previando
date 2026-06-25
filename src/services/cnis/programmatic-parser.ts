import { CnisExtractedData, generateMarkdown } from './types'

export function parseCnisProgrammatically(
  pdfText: string
): { markdown: string; extractedData: CnisExtractedData } | null {
  if (!pdfText || pdfText.trim().length === 0) return null

  // Normalizar quebras de linha e limpar espaços extras
  const lines = pdfText.split(/\r?\n/).map(line => line.trim())

  let nit: string | null = null
  let nome: string | null = null
  let dataNascimento: string | null = null

  // 1. Extração de dados básicos usando regexes flexíveis (suporta linha única e multi-linha)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const nextLine = i + 1 < lines.length ? lines[i + 1] : ''

    // NIT
    if (!nit) {
      const nitMatch = line.match(/(?:NIT|PIS\/PASEP|Inscrição|PIS):\s*(\d{3}[\s.-]?\d{5}[\s.-]?\d{2}[\s.-]?\d)/i)
      if (nitMatch) {
        const clean = nitMatch[1].replace(/[\s.-]/g, '')
        if (clean.length === 11) {
          nit = `${clean.slice(0, 3)}.${clean.slice(3, 8)}.${clean.slice(8, 10)}-${clean.slice(10)}`
        }
      } else if (line.toUpperCase() === 'NIT:' || line.toUpperCase() === 'NIT') {
        const clean = nextLine.replace(/[\s.-]/g, '')
        if (clean.length === 11) {
          nit = `${clean.slice(0, 3)}.${clean.slice(3, 8)}.${clean.slice(8, 10)}-${clean.slice(10)}`
        }
      }
    }

    // Nome
    if (!nome) {
      const nomeMatch = line.match(/(?:Nome|Nome do Segurado):\s*([A-Za-zÀ-ÖØ-öø-ÿ\s]+)/i)
      if (nomeMatch) {
        const candidate = nomeMatch[1].trim()
        if (
          candidate.split(/\s+/).length >= 2 &&
          !candidate.toUpperCase().includes('SEGURADO') &&
          !candidate.toUpperCase().includes('CNIS')
        ) {
          nome = candidate.toUpperCase()
        }
      } else if (line.toUpperCase() === 'NOME:' || line.toUpperCase() === 'NOME DO SEGURADO:') {
        const candidate = nextLine.trim()
        if (
          candidate.split(/\s+/).length >= 2 &&
          !candidate.toUpperCase().includes('SEGURADO') &&
          !candidate.toUpperCase().includes('CNIS')
        ) {
          nome = candidate.toUpperCase()
        }
      }
    }

    // Data de Nascimento
    if (!dataNascimento) {
      const nascMatch = line.match(/(?:Data de Nascimento|Nascimento|D\.Nasc):\s*(\d{2}\/\d{2}\/\d{4})/i)
      if (nascMatch) {
        const parts = nascMatch[1].split('/')
        if (parts.length === 3) {
          dataNascimento = `${parts[2]}-${parts[1]}-${parts[0]}` // YYYY-MM-DD
        }
      } else if (line.toUpperCase().includes('DATA DE NASCIMENTO:') || line.toUpperCase() === 'NASCIMENTO:') {
        const nascMatchNext = nextLine.match(/(\d{2}\/\d{2}\/\d{4})/)
        if (nascMatchNext) {
          const parts = nascMatchNext[1].split('/')
          dataNascimento = `${parts[2]}-${parts[1]}-${parts[0]}`
        }
      }
    }
  }

  // Se não achar os dados fundamentais, abortamos para IA
  if (!nit || !nome) {
    return null
  }

  // 2. Extração de Períodos e Salários
  interface TempPeriod {
    seq: string | null
    cnpj: string | null
    empregador: string | null
    inicio: string | null
    fim: string | null
    isBeneficio: boolean
    salarios: Array<{ competencia: string; valor: number }>
  }

  const periods: TempPeriod[] = []
  let currentPeriod: TempPeriod | null = null

  const isIgnored = /^(Competência|Remuneração|Indicadores|Remunerações|Empregado ou Agente|Público|Benefício|Filiado|Seq|NIT|CPF|Matrícula|Trabalhador|Origem do Vínculo|Espécie|Situação)$/i

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detectar início de novo período
    const seqMatch = line.match(/\bSeq(?:\.|:|uência)?\s*:?\s*(\d+)/i)
    const isSeqLine = line.toUpperCase() === 'SEQ.' || line.toUpperCase() === 'SEQ' || line.toUpperCase() === 'SEQ. EMPREGADOR'
    const cnpjMatch = line.match(/(?:CNPJ|CEI|CPF):\s*([\d./-]+)/i)
    const relPrevidenciaria = line.match(/\bRelação\s+Previdenciária\s*:?\s*(\d+)/i)

    const hasSeq = !!seqMatch || isSeqLine
    const hasCnpj = !!cnpjMatch
    const hasRel = !!relPrevidenciaria

    if (hasSeq || hasCnpj || hasRel) {
      let matchedSeq = seqMatch ? seqMatch[1] : null
      let seqLineIndex = i

      // Se for apenas a linha de trigger "Seq." sem o número, procurar nas próximas 5 linhas
      if (!matchedSeq && isSeqLine) {
        for (let offset = 1; offset <= 5; offset++) {
          const lIndex = i + offset
          if (lIndex < lines.length) {
            const numMatch = lines[lIndex].match(/^(\d+)$/)
            if (numMatch) {
              matchedSeq = numMatch[1]
              seqLineIndex = lIndex
              break
            }
          }
        }
      }

      const matchedCnpj = cnpjMatch ? cnpjMatch[1] : null
      const matchedRel = relPrevidenciaria ? relPrevidenciaria[1] : null

      let shouldCreateNew = false

      if (!currentPeriod) {
        shouldCreateNew = true
      } else {
        if (hasSeq && matchedSeq) {
          shouldCreateNew = true
        } else if (hasCnpj) {
          if (currentPeriod.cnpj || currentPeriod.salarios.length > 0) {
            shouldCreateNew = true
          }
        } else if (hasRel) {
          if (currentPeriod.seq || currentPeriod.cnpj || currentPeriod.salarios.length > 0) {
            shouldCreateNew = true
          }
        }
      }

      if (shouldCreateNew) {
        if (currentPeriod && !currentPeriod.isBeneficio && (currentPeriod.salarios.length > 0 || currentPeriod.empregador)) {
          periods.push(currentPeriod)
        }

        currentPeriod = {
          seq: matchedSeq || (hasRel ? matchedRel : null),
          cnpj: matchedCnpj,
          empregador: null,
          inicio: null,
          fim: null,
          isBeneficio: false,
          salarios: []
        }
      } else if (currentPeriod) {
        if (matchedSeq && !currentPeriod.seq) currentPeriod.seq = matchedSeq
        if (matchedCnpj && !currentPeriod.cnpj) currentPeriod.cnpj = matchedCnpj
        if (matchedRel && !currentPeriod.seq) currentPeriod.seq = matchedRel
      }

      // Tentar ler o empregador e datas a partir da vizinhança do Seq
      if (currentPeriod) {
        // 1. Procurar Empregador no layout de linha única (Razão Social: ...)
        const empMatch = line.match(/(?:Razão Social|Empregador|Nome do Empregador|Empresa|Origem do Vínculo):\s*(.+)$/i)
        let empregador = empMatch ? empMatch[1].trim() : null

        // 2. Se não encontrar, fazer busca na vizinhança
        if (!empregador) {
          // Varre as próximas 5 linhas a partir de seqLineIndex
          for (let offset = 1; offset <= 5; offset++) {
            const lIndex = seqLineIndex + offset
            if (lIndex < lines.length) {
              const lText = lines[lIndex]

              // Se for um rótulo do INSS, data ou número, ignorar
              if (isIgnored.test(lText)) continue
              if (/^\d{2}\/\d{2}\/\d{4}$/.test(lText)) continue
              if (/^\d{2}\/\d{4}$/.test(lText)) continue
              if (/^[\d.,/-]+$/.test(lText)) continue
              if (lText.length < 3) continue

              // Tratar a primeira linha não ignorada como empregador
              const tempEmpMatch = lText.match(/(?:Razão Social|Empregador|Nome do Empregador|Empresa|Origem do Vínculo)?\s*:?\s*(.+)$/i)
              if (tempEmpMatch) {
                empregador = tempEmpMatch[1].trim()
                break
              }
            }
          }
        }

        if (empregador) {
          currentPeriod.empregador = empregador.toUpperCase()
          if (
            empregador.toUpperCase().includes('BENEFICIO') ||
            empregador.toUpperCase().includes('BENEFÍCIO') ||
            /\bB\d{2}\b/.test(empregador.toUpperCase())
          ) {
            currentPeriod.isBeneficio = true
          }
        }

        // 3. Procurar datas na vizinhança no layout vertical
        // Varre as próximas 8 linhas para encontrar datas
        for (let offset = 1; offset <= 8; offset++) {
          const lIndex = seqLineIndex + offset
          if (lIndex < lines.length) {
            const dateMatch = lines[lIndex].match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
            if (dateMatch) {
              const competencia = `${dateMatch[3]}-${dateMatch[2]}` // YYYY-MM
              if (!currentPeriod.inicio) {
                currentPeriod.inicio = competencia
              } else if (!currentPeriod.fim && competencia !== currentPeriod.inicio) {
                currentPeriod.fim = competencia
              }
            }
          }
        }
      }
    }

    if (!currentPeriod) continue

    // Extrair datas de início/fim do período (caso linha única tradicional)
    if (!currentPeriod.inicio) {
      const dateRangeMatch = line.match(/(?:Data\s+Início|Admissão|Início):\s*(\d{2}\/\d{2}\/\d{4})/i)
      if (dateRangeMatch) {
        const parts = dateRangeMatch[1].split('/')
        currentPeriod.inicio = `${parts[2]}-${parts[1]}` // YYYY-MM
      }
    }
    if (!currentPeriod.fim) {
      const dateEndMatch = line.match(/(?:Data\s+Fim|Rescisão|Fim):\s*(\d{2}\/\d{2}\/\d{4})/i)
      if (dateEndMatch) {
        const parts = dateEndMatch[1].split('/')
        currentPeriod.fim = `${parts[2]}-${parts[1]}` // YYYY-MM
      }
    }

    // Checar se a linha atual indica que o período é do tipo Benefício
    if (
      !currentPeriod.isBeneficio &&
      (line.toUpperCase().includes('BENEFICIO') ||
        line.toUpperCase().includes('BENEFÍCIO') ||
        /\bB\d{2}\b/.test(line))
    ) {
      if (!line.includes('Indicadores:')) {
        currentPeriod.isBeneficio = true
      }
    }

    // Extrair competências e salários (casando tanto layout de linha única quanto layout multi-linha)
    let rawComp: string | null = null
    let rawVal: string | null = null
    let rawIndicators = ''

    const singleLineMatch = line.match(/^(\d{2}\/\d{4})\s+([\d.,]+)(?:\s+(.*))?$/)
    if (singleLineMatch) {
      rawComp = singleLineMatch[1]
      rawVal = singleLineMatch[2]
      rawIndicators = singleLineMatch[3] ? singleLineMatch[3].trim() : ''
    } else {
      const compMatch = line.match(/^(\d{2}\/\d{4})$/)
      if (compMatch) {
        const nextLine1 = i + 1 < lines.length ? lines[i + 1] : ''
        const nextLine2 = i + 2 < lines.length ? lines[i + 2] : ''

        const valMatch = nextLine1.match(/^([\d.,]+)$/)
        if (valMatch) {
          rawComp = compMatch[1]
          rawVal = valMatch[1]

          const isNextLineIndicator = nextLine2 &&
            /^[A-Z0-9\s,-]+$/.test(nextLine2) &&
            !/^\d{2}\/\d{4}$/.test(nextLine2) &&
            !/^[\d.,]+$/.test(nextLine2)

          if (isNextLineIndicator) {
            rawIndicators = nextLine2.trim()
            i += 2
          } else {
            i += 1
          }
        }
      }
    }

    if (rawComp && rawVal) {
      const hasBlockIndicator = /BLOQ-EC103|PREM-FVIN|PREM-BLOQ-EC103/i.test(rawIndicators)

      if (!hasBlockIndicator) {
        const parts = rawComp.split('/')
        const competencia = `${parts[1]}-${parts[0]}` // YYYY-MM
        const valor = parseFloat(rawVal.replace(/\./g, '').replace(',', '.'))

        if (!isNaN(valor)) {
          const existing = currentPeriod.salarios.find(s => s.competencia === competencia)
          if (existing) {
            existing.valor = parseFloat((existing.valor + valor).toFixed(2))
          } else {
            currentPeriod.salarios.push({ competencia, valor })
          }
        }
      }
    }
  }

  // Adicionar o último período ativo/lido
  if (currentPeriod && !currentPeriod.isBeneficio && (currentPeriod.salarios.length > 0 || currentPeriod.empregador)) {
    periods.push(currentPeriod)
  }

  // 3. Pós-processamento dos períodos
  const formattedPeriods = periods.map(p => {
    p.salarios.sort((a, b) => a.competencia.localeCompare(b.competencia))

    const gaps: string[] = []
    if (p.salarios.length > 1) {
      const first = p.salarios[0].competencia
      const last = p.salarios[p.salarios.length - 1].competencia

      let [firstY, firstM] = first.split('-').map(Number)
      const [lastY, lastM] = last.split('-').map(Number)

      while (true) {
        firstM++
        if (firstM > 12) {
          firstM = 1
          firstY++
        }
        if (firstY > lastY || (firstY === lastY && firstM >= lastM)) {
          break
        }
        const compToCheck = `${firstY}-${String(firstM).padStart(2, '0')}`
        if (!p.salarios.some(s => s.competencia === compToCheck)) {
          gaps.push(compToCheck)
        }
      }
    }

    return {
      empregador: p.empregador,
      inicio: p.inicio || (p.salarios.length > 0 ? p.salarios[0].competencia : null),
      fim: p.fim || (p.salarios.length > 0 ? p.salarios[p.salarios.length - 1].competencia : null),
      salarios: p.salarios,
      gaps
    }
  })

  // 4. Calcular métricas globais e retornar objeto final
  const allSalaries = formattedPeriods.flatMap(p => p.salarios)
  if (allSalaries.length === 0) {
    return null
  }

  allSalaries.sort((a, b) => a.competencia.localeCompare(b.competencia))
  const primeiraContribuicao = allSalaries[0].competencia
  const ultimaContribuicao = allSalaries[allSalaries.length - 1].competencia
  const totalContribuicoes = allSalaries.length

  const extractedData: CnisExtractedData = {
    nit,
    nome,
    dataNascimento,
    totalContribuicoes,
    primeiraContribuicao,
    ultimaContribuicao,
    periodos: formattedPeriods
  }

  return {
    markdown: generateMarkdown(extractedData),
    extractedData
  }
}
