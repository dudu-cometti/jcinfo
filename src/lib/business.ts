// Dados do negócio que precisam bater com o Perfil da Empresa no Google (NAP:
// nome, endereço, telefone). Se mudar algo no perfil, atualize aqui também.

/** Link público do perfil no Google Maps (CID do Perfil da Empresa). */
export const GOOGLE_MAPS_URL = 'https://www.google.com/maps?cid=8206517357166280658'

/** Link curto que abre direto a caixa de avaliação do perfil. */
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CdI_-WwOaONxEBM/review'

/** Telefone principal cadastrado no Perfil da Empresa (formato E.164). */
export const BUSINESS_PHONE = '+55-27-99904-8005'

export const BUSINESS_CITY = 'Colatina'
export const BUSINESS_STATE = 'ES'
export const BUSINESS_POSTAL_CODE = '29700-030'

/** Cidades atendidas com entrega em mãos — mesma lista da área de atendimento do perfil. */
export const SERVICE_AREA = [
  'Colatina',
  'Baixo Guandu',
  'Marilândia',
  'São Domingos do Norte',
  'Governador Lindenberg',
  'Pancas',
  'Águia Branca',
  'São Roque do Canaã',
  'Linhares',
  'São Gabriel da Palha',
]

/** Horário igual ao do perfil: segunda a sábado, 07:00–19:00. */
export const OPENING_HOURS = {
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  opens: '07:00',
  closes: '19:00',
  label: 'Segunda a sábado, das 7h às 19h',
}
