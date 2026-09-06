import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/data/settings'

export const metadata: Metadata = {
  title: 'Política de privacidade',
}

export default async function PrivacyPage() {
  const settings = await getSiteSettings()

  return (
    <article className="max-w-2xl space-y-4 text-neutral-700">
      <h1 className="text-2xl font-semibold text-neutral-900">Política de privacidade</h1>

      <p>
        Esta página explica quais dados a {settings.site_name} coleta, para que servem, e como você
        pode solicitar acesso, correção ou exclusão dos seus dados, em conformidade com a Lei Geral
        de Proteção de Dados (LGPD).
      </p>

      <h2 className="text-lg font-medium text-neutral-900">Quais dados coletamos</h2>
      <p>Ao ser atendido por um vendedor ou realizar uma compra, coletamos apenas:</p>
      <ul className="list-disc pl-6">
        <li>Nome</li>
        <li>Telefone</li>
        <li>E-mail (opcional)</li>
        <li>Histórico de compras e pontos acumulados</li>
      </ul>
      <p>Não coletamos dados sensíveis nem qualquer informação além do necessário para o atendimento.</p>

      <h2 className="text-lg font-medium text-neutral-900">Finalidade</h2>
      <p>Seus dados são usados exclusivamente para:</p>
      <ul className="list-disc pl-6">
        <li>Identificar você em futuras compras e evitar cadastros duplicados</li>
        <li>Calcular e exibir seus pontos de fidelidade e sua posição no ranking</li>
        <li>Permitir sua participação em campanhas e sorteios</li>
        <li>Contato para atendimento comercial, quando você iniciar a conversa</li>
      </ul>

      <h2 className="text-lg font-medium text-neutral-900">Acesso e controle</h2>
      <p>
        Você pode solicitar a qualquer momento a visualização, correção ou exclusão dos seus dados
        entrando em contato pelo WhatsApp com um de nossos vendedores. Atendemos a solicitação em até
        15 dias úteis, salvo obrigação legal de retenção (por exemplo, notas fiscais).
      </p>

      <h2 className="text-lg font-medium text-neutral-900">Acesso interno</h2>
      <p>
        Apenas administradores e vendedores autenticados têm acesso aos seus dados de contato, e cada
        alteração é registrada em um log de auditoria interno. Vendedores não têm acesso a informações
        administrativas ou financeiras que não sejam necessárias para o atendimento.
      </p>
    </article>
  )
}
