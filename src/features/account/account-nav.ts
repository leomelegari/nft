import UserIcon from '@/assets/icons/user.svg?react'
import LocationIcon from '@/assets/icons/location.svg?react'
import ShoppingIcon from '@/assets/icons/shopping.svg?react'
import HeartIcon from '@/assets/icons/heart.svg?react'
import ActivityIcon from '@/assets/icons/activity.svg?react'
import DownloadIcon from '@/assets/icons/download.svg?react'
import DangerTriangleIcon from '@/assets/icons/danger-triangle.svg?react'

/**
 * The account sidebar's eight destinations, in the Figma's order.
 *
 * Only "Dados do perfil" and "Carteiras" are in the delivery scope; the other
 * five are editorial or post-purchase areas with no screen in the file and no
 * endpoint behind them. They are rendered — the sidebar would misrepresent the
 * design without them — but marked unavailable so they cannot look functional,
 * the same rule the main nav applies to "Criadores" and "Aprenda".
 */
export type AccountNavTarget = '/perfil' | '/carteiras'

interface AccountNavItemBase {
  label: string
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>
}

export interface AvailableAccountNavItem extends AccountNavItemBase {
  available: true
  to: AccountNavTarget
}

export interface UnavailableAccountNavItem extends AccountNavItemBase {
  available: false
}

export type AccountNavItem = AvailableAccountNavItem | UnavailableAccountNavItem

export const ACCOUNT_NAV_ITEMS: AccountNavItem[] = [
  { label: 'Dados do perfil', icon: UserIcon, available: true, to: '/perfil' },
  { label: 'Carteiras', icon: LocationIcon, available: true, to: '/carteiras' },
  { label: 'Atividade', icon: ShoppingIcon, available: false },
  { label: 'Lista de interesse', icon: HeartIcon, available: false },
  { label: 'Ofertas', icon: ActivityIcon, available: false },
  { label: 'Arquivos baixados', icon: DownloadIcon, available: false },
  { label: 'Suporte', icon: DangerTriangleIcon, available: false },
]
