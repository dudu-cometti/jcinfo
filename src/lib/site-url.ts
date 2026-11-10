// URL pública do site, sem barra no final, para que `${SITE_URL}/produtos` nunca
// vire "https://dominio.com.br//produtos". Em produção, NEXT_PUBLIC_SITE_URL precisa
// ser o domínio cadastrado no Perfil da Empresa no Google (https://www.lojajcinfo.com.br):
// é daqui que saem canonical, sitemap, robots e os dados estruturados.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
