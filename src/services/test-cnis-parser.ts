import { parseCnisProgrammatically } from './cnis'

console.log('=== TESTE 1: LAYOUT LINHA ÚNICA ===')

const dummyCnisText1 = `
REPÚBLICA FEDERATIVA DO BRASIL
INSS - INSTITUTO NACIONAL DO SEGURO SOCIAL
CNIS - CADASTRO NACIONAL DE INFORMAÇÕES SOCIAIS

1. DADOS DO SEGURADO
NIT: 123.45678.90-1
Nome: JOÃO DA SILVA
Data de Nascimento: 15/01/1980

RELAÇÕES PREVIDENCIÁRIAS

Seq: 001
Razão Social: EMPRESA DE TESTE LTDA
CNPJ/CEI/CPF: 12.345.678/0001-99
Data Início: 01/01/2010
Data Fim: 31/12/2012

Competência Remuneração Indicadores
01/2010 1.000,00
02/2010 1.000,00
03/2010 1.100,00
05/2010 1.100,00
09/2010 1.200,00 IREM-ACD
09/2010 100,00 IREM-ACD
10/2010 1.200,00 BLOQ-EC103

Seq: 002
Razão Social: BENEFICIO ESPÉCIE B31
Seq: 003
Razão Social: OUTRA EMPRESA S/A
CNPJ/CEI/CPF: 98.765.432/0001-00
Data Início: 01/06/2015
Data Fim: 

Competência Remuneração Indicadores
06/2015 2.000,00
07/2015 2.100,00
`

const result1 = parseCnisProgrammatically(dummyCnisText1)

if (!result1) {
  console.error('❌ Teste 1 falhou: parser retornou null!')
  process.exit(1)
}

const { extractedData: data1 } = result1
let ok = true

if (data1.nit !== '123.45678.90-1') {
  console.error('❌ Teste 1: NIT incorreto')
  ok = false
}
if (data1.nome !== 'JOÃO DA SILVA') {
  console.error('❌ Teste 1: Nome incorreto')
  ok = false
}
if (data1.dataNascimento !== '1980-01-15') {
  console.error('❌ Teste 1: Data de nascimento incorreta')
  ok = false
}
if (data1.periodos?.length !== 2) {
  console.error(`❌ Teste 1: Esperava 2 períodos, obteve ${data1.periodos?.length}`)
  ok = false
} else {
  const p1 = data1.periodos[0]
  const s09 = p1.salarios.find(s => s.competencia === '2010-09')
  if (!s09 || s09.valor !== 1300.00) {
    console.error('❌ Teste 1: Falha ao somar remunerações duplicadas (esperava 1300.00)')
    ok = false
  }
}

console.log('✅ Teste 1 concluído com sucesso!')

console.log('\n=== TESTE 2: LAYOUT MULTILINHA (USUÁRIO) ===')

const dummyCnisText2 = `
INSS
CNIS - Cadastro Nacional de Informações Sociais
Extrato Previdenciário
24/06/2026 14:19:30
NIT:
117.44165.81-0
CPF:
083.114.104-29
Nome:
RENATO BEZERRA GOMES DA SILVA JUNIOR
Data de nascimento:
15/12/1996

Relações Previdenciárias

Seq.
NIT
1
1395209925
87 - AMP. SOCIAL PESSOA PORTADORA
DEFICIENCIA
11/11/2002
01/09/2020
3 - SUSPENSO
117.44165.81-0
Benefício

Seq.
NIT
Matrícula do
Trabalhador
2
92.306.257
MV INFORMATICA NORDESTE LTDA
Empregado ou Agente
Público
10/07/2017
18/05/2018
05/2018
117.44165.81-0
3762
Competência
Remuneração
Indicadores
Remunerações
07/2017
1.121,15
08/2017
1.552,63
09/2017
1.528,80

Seq.
NIT
Matrícula do
Trabalhador
3
04.049.976
AVANADE DO BRASIL LTDA
Empregado ou Agente
Público
21/05/2018
01/10/2021
117.44165.81-0
1713
Competência
Remuneração
Indicadores
Remunerações
05/2018
916,67
06/2018
2.500,00
07/2018
2.500,00
08/2018
2.500,00
09/2018
3.841,35
09/2018
161,87
IREM-ACD
10/2018
2.971,48
10/2018
80,94
IREM-ACD
11/2021
0,79
PREM-FVIN, PREM-
BLOQ-EC103,
IREM-ACD
`

const result2 = parseCnisProgrammatically(dummyCnisText2)

if (!result2) {
  console.error('❌ Teste 2 falhou: parser retornou null!')
  process.exit(1)
}

const { extractedData: data2 } = result2

console.log('--- DADOS EXTRAÍDOS (TESTE 2) ---')
console.log('NIT:', data2.nit)
console.log('Nome:', data2.nome)
console.log('Data de Nascimento:', data2.dataNascimento)
console.log('Total de Contribuições:', data2.totalContribuicoes)

if (data2.nit !== '117.44165.81-0') {
  console.error('❌ Teste 2: NIT incorreto (esperava 117.44165.81-0, obteve:', data2.nit)
  ok = false
}
if (data2.nome !== 'RENATO BEZERRA GOMES DA SILVA JUNIOR') {
  console.error('❌ Teste 2: Nome incorreto')
  ok = false
}
if (data2.dataNascimento !== '1996-12-15') {
  console.error('❌ Teste 2: Data de nascimento incorreta (esperava 1996-12-15, obteve:', data2.dataNascimento)
  ok = false
}

// Períodos: Seq 1 é benefício (ignorado). Seq 2 e Seq 3 são válidos.
if (data2.periodos?.length !== 2) {
  console.error(`❌ Teste 2: Esperava 2 períodos válidos, obteve ${data2.periodos?.length}`)
  ok = false
} else {
  const p2 = data2.periodos[0] // Seq 2
  const p3 = data2.periodos[1] // Seq 3

  console.log('Período 2 (Seq 2) Empregador:', p2.empregador)
  console.log('Período 2 (Seq 2) Salários:', p2.salarios)

  console.log('Período 3 (Seq 3) Empregador:', p3.empregador)
  console.log('Período 3 (Seq 3) Salários:', p3.salarios)

  if (p2.empregador !== 'MV INFORMATICA NORDESTE LTDA') {
    console.error('❌ Teste 2: Empregador do Período 2 incorreto')
    ok = false
  }
  if (p2.salarios.length !== 3) {
    console.error(`❌ Teste 2: Esperava 3 salários no Período 2, obteve ${p2.salarios.length}`)
    ok = false
  }

  if (p3.empregador !== 'AVANADE DO BRASIL LTDA') {
    console.error('❌ Teste 2: Empregador do Período 3 incorreto')
    ok = false
  }

  // Verificar se somou duplicados: 09/2018: 3841,35 + 161,87 = 4003,22
  const s09_p3 = p3.salarios.find(s => s.competencia === '2018-09')
  if (!s09_p3 || s09_p3.valor !== 4003.22) {
    console.error('❌ Teste 2: Falha ao somar duplicados (esperava 4003.22, obteve:', s09_p3?.valor)
    ok = false
  }

  // Verificar se filtrou 11/2021 por causa do indicador de bloqueio PREM-BLOQ-EC103
  const s11_p3 = p3.salarios.find(s => s.competencia === '2021-11')
  if (s11_p3) {
    console.error('❌ Teste 2: Falha ao ignorar competência com indicador de bloqueio PREM-BLOQ-EC103')
    ok = false
  }
}

if (ok) {
  console.log('\n✅ TODOS OS TESTES PASSARAM COM SUCESSO!')
  process.exit(0)
} else {
  console.error('\n❌ HOUVE FALHAS NOS TESTES!')
  process.exit(1)
}
