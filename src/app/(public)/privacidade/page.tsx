import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Previando',
}

export default function PrivacidadePage() {
  return (
    <article className="prose prose-slate max-w-none font-sans">
      <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">Política de Privacidade</h1>
      <p className="text-sm text-slate-500 mb-8">Última atualização: julho de 2026</p>

      <section className="space-y-4 text-slate-700 leading-relaxed">
        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">1. Quais dados coletamos</h2>
        <p>
          <strong>Dados do advogado (usuário):</strong> nome, e-mail, telefone, número da OAB, CPF,
          endereço, estado civil, profissão e dados de pagamento (via Mercado Pago).
        </p>
        <p>
          <strong>Dados de clientes (segurados) inseridos pelo advogado:</strong> nome, CPF (armazenado
          apenas em formato hash, nunca em texto plano), data de nascimento, contatos, dados do CNIS e,
          quando aplicável a benefícios assistenciais (BPC/LOAS), dados de saúde e informações
          socioeconômicas — armazenados com criptografia adicional (AES-256-GCM) por serem dados
          sensíveis.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">2. Base legal para o tratamento</h2>
        <p>
          Tratamos seus dados com base na execução do contrato de uso da plataforma (Art. 7º, V da LGPD),
          no consentimento fornecido no cadastro (Art. 7º, I) e, quando aplicável, no cumprimento de
          obrigação legal ou regulatória (Art. 7º, II — como a retenção de registros fiscais de
          pagamento).
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">3. Papel do Previando (operador) e do advogado (controlador)</h2>
        <p>
          Para os dados de clientes/segurados cadastrados pelo advogado, o Previando atua como
          <strong> operador</strong> de dados, processando-os conforme as instruções e finalidades
          definidas pelo próprio advogado, que atua como <strong>controlador</strong>. Cabe ao advogado
          garantir a base legal adequada para o tratamento dos dados de seus clientes.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">4. Compartilhamento de dados</h2>
        <p>
          Não vendemos dados pessoais. Compartilhamos dados apenas com provedores estritamente
          necessários à operação da plataforma: processamento de pagamentos (Mercado Pago),
          armazenamento de arquivos (Cloudflare R2) e provedores de infraestrutura, todos sob obrigações
          contratuais de confidencialidade.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">5. Segurança</h2>
        <p>
          CPFs são armazenados apenas como hash (HMAC-SHA256), nunca em texto plano. Dados sensíveis de
          análises BPC são criptografados (AES-256-GCM). Todas as ações relevantes sobre dados pessoais
          são registradas em uma trilha de auditoria com verificação de integridade, e o acesso aos
          registros é protegido contra acesso indevido entre contas (controle anti-IDOR).
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">6. Retenção de dados</h2>
        <p>
          Dados de clientes e casos são mantidos enquanto sua conta estiver ativa ou até que você os
          exclua ou anonimize. Registros de pagamento são retidos por 5 anos após sua criação, mesmo
          após o cancelamento do plano ou exclusão da conta, conforme exigido pela legislação fiscal
          brasileira. Registros de auditoria são mantidos por motivos de segurança e conformidade mesmo
          após a exclusão da conta associada.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">7. Seus direitos como titular de dados</h2>
        <p>Nos termos do Art. 18 da LGPD, você pode, a qualquer momento e diretamente pela plataforma:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Confirmar a existência de tratamento e acessar seus dados;</li>
          <li>Corrigir dados incompletos, inexatos ou desatualizados nas configurações do seu perfil;</li>
          <li>Exportar uma cópia completa de seus dados (portabilidade), na seção de configurações;</li>
          <li>Solicitar a exclusão de sua conta, com anonimização dos dados pessoais e exclusão dos
            dados de negócio (clientes, casos, cálculos), preservando apenas o que a lei exige (registros
            fiscais e de auditoria);</li>
          <li>Anonimizar um cliente específico, mantendo o histórico de casos sem dados identificáveis.</li>
        </ul>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">8. Encarregado de proteção de dados (DPO)</h2>
        <p>
          Dúvidas sobre esta Política ou solicitações relacionadas aos seus dados podem ser enviadas
          para o suporte da plataforma.
        </p>

        <h2 className="font-serif text-xl font-bold text-slate-900 mt-8 mb-3">9. Alterações nesta política</h2>
        <p>
          Esta Política pode ser atualizada periodicamente. Alterações relevantes serão comunicadas por
          e-mail ou através da própria plataforma.
        </p>
      </section>
    </article>
  )
}
