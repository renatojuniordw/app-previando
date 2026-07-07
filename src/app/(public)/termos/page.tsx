import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — Previando',
}

export default function TermosPage() {
  return (
    <article className="prose prose-slate max-w-none font-sans">
      <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">Termos de Uso</h1>
      <p className="text-sm text-slate-500 mb-8">Última atualização: julho de 2026</p>

      <section className="space-y-4 text-slate-700 leading-relaxed">
        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">1. Sobre o Previando</h2>
        <p>
          O Previando é uma plataforma de software como serviço (SaaS) destinada a advogados e
          escritórios de advocacia previdenciária, oferecendo ferramentas de cálculo de benefícios,
          gestão de clientes e casos, geração de pareceres e documentos, entre outras funcionalidades
          relacionadas à prática previdenciária.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">2. Cadastro e conta</h2>
        <p>
          Para usar o Previando, você deve criar uma conta com informações verdadeiras e completas.
          Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas
          as atividades realizadas em sua conta.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">3. Papel do advogado como controlador de dados</h2>
        <p>
          Ao cadastrar dados de clientes (segurados) na plataforma — incluindo CPF, dados de saúde e
          informações previdenciárias — você atua como <strong>controlador</strong> desses dados pessoais,
          nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). O Previando atua como
          <strong> operador</strong>, processando esses dados exclusivamente conforme suas instruções e
          para viabilizar as funcionalidades da plataforma.
        </p>
        <p>
          Você declara possuir base legal e, quando aplicável, consentimento de seus clientes para o
          tratamento dos dados pessoais inseridos na plataforma.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">4. Planos e pagamentos</h2>
        <p>
          O Previando oferece planos gratuitos e pagos. Assinaturas pagas são processadas via
          Mercado Pago e podem ser canceladas a qualquer momento nas configurações de sua conta.
          Registros de pagamento são mantidos pelo prazo exigido pela legislação fiscal brasileira
          (5 anos), mesmo após o cancelamento do plano ou exclusão da conta.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">5. Uso aceitável</h2>
        <p>
          É vedado utilizar a plataforma para fins ilícitos, inserir dados de terceiros sem base legal
          adequada, tentar acessar dados de outros usuários, ou realizar engenharia reversa do software.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">6. Cálculos e responsabilidade profissional</h2>
        <p>
          Os cálculos e pareceres gerados pela plataforma são ferramentas de apoio ao trabalho do
          advogado. A conferência final e a responsabilidade profissional sobre as peças e cálculos
          apresentados a clientes e órgãos competentes são exclusivas do advogado usuário.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">7. Alterações nos termos</h2>
        <p>
          Podemos atualizar estes Termos periodicamente. Alterações relevantes serão comunicadas por
          e-mail ou através da própria plataforma.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">8. Contato</h2>
        <p>
          Dúvidas sobre estes Termos podem ser enviadas para o suporte da plataforma.
        </p>
      </section>
    </article>
  )
}
