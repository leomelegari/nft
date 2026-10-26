import { AccountSidebar } from '@/features/account/account-sidebar'

/**
 * Page chrome for the account area: the sidebar plus the screen's own column.
 *
 * The Figma body is a 310px sidebar and a flexible content column, 28px apart.
 * Below `lg` the sidebar becomes a full-width block above the content rather
 * than a narrow rail, which is the only way the 45px rows and their labels
 * stay legible at 390px.
 */
export function AccountLayout({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-7 px-5 py-6 lg:flex-row lg:py-8">
      <AccountSidebar />

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <h1 className="text-body-xl font-bold text-foreground">{title}</h1>
        {children}
      </div>
    </div>
  )
}
