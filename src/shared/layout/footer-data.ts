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

/**
 * A footer link is inert unless it has somewhere real to go.
 *
 * Most of these destinations are outside the delivery and stay as plain text,
 * which is what keeps them from looking functional. The three that do exist
 * are linked — leaving "Lista de interesse" dead here while the same item
 * works in the account sidebar would be the kind of inconsistency the rule is
 * meant to prevent.
 */
export interface FooterLink {
  label: string
  to?: '/perfil' | '/carteiras' | '/lista-de-interesse'
}

export const FOOTER_COLUMNS: ReadonlyArray<{
  title: string
  links: readonly FooterLink[]
}> = [
  {
    title: 'Meu perfil',
    links: [
      { label: 'Meu perfil', to: '/perfil' },
      { label: 'Minha coleção' },
      { label: 'Atividade' },
      { label: 'Estúdio do criador' },
      { label: 'Lista de interesse', to: '/lista-de-interesse' },
    ],
  },
  {
    title: 'Central de ajuda',
    links: [
      { label: 'Central de ajuda' },
      { label: 'Como comprar NFTs' },
      { label: 'Carteira e segurança' },
      { label: 'Política do mercado' },
      { label: 'Denunciar item' },
    ],
  },
  {
    title: 'Coleções',
    links: [
      { label: 'Arte digital' },
      { label: 'Fotografia' },
      { label: 'Música' },
      { label: 'Arte 3D' },
      { label: 'Utilidade' },
    ],
  },
]

export const FOOTER_SOCIALS = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'X (Twitter)', Icon: TwitterIcon },
  { label: 'LinkedIn', Icon: LinkedinIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
] as const

export const COMPATIBLE_WALLETS = ['METAMASK', 'WALLETCONNECT', 'COINBASE'] as const
