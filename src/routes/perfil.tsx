import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { useCurrentUser } from '@/features/auth/queries'
import { AccountLayout } from '@/features/account/account-layout'
import { ProfileForm } from '@/features/account/profile-form'
import { PasswordForm } from '@/features/account/password-form'
import { SkeletonBlock, SkeletonGroup } from '@/shared/ui/skeleton-primitives'

export const Route = createFileRoute('/perfil')({
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  component: ProfilePage,
})

function ProfilePage() {
  const user = useCurrentUser()

  return (
    <AccountLayout title="Perfil do colecionador">
      {user ? (
        <>
          {/*
            Keyed on the user id so switching accounts remounts the form with
            the new values instead of syncing props into state in an effect.
          */}
          <ProfileForm key={user.id} user={user} />
          <PasswordForm />
        </>
      ) : (
        <SkeletonGroup label="Carregando perfil">
          <div className="flex flex-col gap-6">
            <SkeletonBlock className="h-10 w-full max-w-[417px]" />
            <SkeletonBlock className="h-10 w-full max-w-[417px]" />
            <SkeletonBlock className="h-24 w-full max-w-[417px]" />
          </div>
        </SkeletonGroup>
      )}
    </AccountLayout>
  )
}
