import { BellIcon, PaletteIcon, ShieldCheckIcon } from 'lucide-react'
import FacebookIcon from '@/assets/icons/social-facebook.svg?react'
import InstagramIcon from '@/assets/icons/social-instagram.svg?react'
import LinkedinIcon from '@/assets/icons/social-linkedin.svg?react'
import TwitterIcon from '@/assets/icons/social-twitter.svg?react'
import YoutubeIcon from '@/assets/icons/social-youtube.svg?react'

/**
 * The Figma renders these medallions as bare letters (W / C / D) — a
 * placeholder, not a design decision. Each one gets an icon that actually
 * represents its heading instead, from lucide-react — the icon library
 * already installed and configured as this project's default (see
 * `components.json`'s `iconLibrary`, and `shared/ui/dialog.tsx`'s own
 * `XIcon` import) — rather than hand-drawn SVGs.
 */
export const FOOTER_HIGHLIGHTS = [
  {
    Icon: ShieldCheckIcon,
    title: 'Segurança da carteira',
    body: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    Icon: PaletteIcon,
    title: 'Criadores em destaque',
    body: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    Icon: BellIcon,
    title: 'Alertas de lançamentos',
    body: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
] as const

export const FOOTER_COLUMNS = [
  {
    title: 'Meu perfil',
    links: [
      'Meu perfil',
      'Minha coleção',
      'Atividade',
      'Estúdio do criador',
      'Lista de interesse',
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    links: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
] as const

export const FOOTER_SOCIALS = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'X (Twitter)', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
] as const

export const COMPATIBLE_WALLETS = ['METAMASK', 'WALLETCONNECT', 'COINBASE'] as const
