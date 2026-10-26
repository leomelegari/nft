import { z } from 'zod'
import { isoDateSchema } from '@/entities/common'
import { networkSchema } from '@/entities/nft'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  avatar: z.string().nullable(),
  bio: z.string(),
  location: z.string(),
  memberSince: isoDateSchema,
})
export type User = z.infer<typeof userSchema>

export const sessionSchema = z.object({
  user: userSchema,
  expiresAt: isoDateSchema,
})
export type Session = z.infer<typeof sessionSchema>

/* -------------------------------------------------------------------------- */
/* Request payloads — these double as the form validation schemas, so the       */
/* client and the simulated server can never disagree about what is valid.      */
/* -------------------------------------------------------------------------- */

const emailField = z
  .string()
  .min(1, 'Informe seu e-mail')
  .email('Informe um e-mail válido')

const passwordField = z
  .string()
  .min(8, 'A senha deve ter ao menos 8 caracteres')
  .regex(/[a-z]/, 'A senha deve conter uma letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter uma letra maiúscula')
  .regex(/\d/, 'A senha deve conter um número')

export const loginInputSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const registerInputSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome'),
    email: emailField,
    password: passwordField,
    passwordConfirmation: z.string().min(1, 'Confirme sua senha'),
    acceptedTerms: z.literal(true, { message: 'É necessário aceitar os termos' }),
  })
  .refine((input) => input.password === input.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não coincidem',
  })
export type RegisterInput = z.infer<typeof registerInputSchema>

export const profileInputSchema = z.object({
  name: z.string().min(2, 'Informe seu nome'),
  email: emailField,
  bio: z.string().max(280, 'A bio deve ter no máximo 280 caracteres'),
  location: z.string().max(80, 'Local deve ter no máximo 80 caracteres'),
})
export type ProfileInput = z.infer<typeof profileInputSchema>

export const passwordChangeInputSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual'),
    newPassword: passwordField,
    newPasswordConfirmation: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((input) => input.newPassword === input.newPasswordConfirmation, {
    path: ['newPasswordConfirmation'],
    message: 'As senhas não coincidem',
  })
export type PasswordChangeInput = z.infer<typeof passwordChangeInputSchema>

/* -------------------------------------------------------------------------- */
/* Wallets                                                                      */
/* -------------------------------------------------------------------------- */

export const WALLET_KINDS = ['primary', 'secondary'] as const
export const walletKindSchema = z.enum(WALLET_KINDS)
export type WalletKind = z.infer<typeof walletKindSchema>

export const WALLET_PROVIDERS = [
  'metamask',
  'coinbase',
  'phantom',
  'walletconnect',
] as const
export const walletProviderSchema = z.enum(WALLET_PROVIDERS)
export type WalletProvider = z.infer<typeof walletProviderSchema>

export const WALLET_PROVIDER_LABELS: Record<WalletProvider, string> = {
  metamask: 'MetaMask',
  coinbase: 'Coinbase Wallet',
  phantom: 'Phantom',
  walletconnect: 'WalletConnect',
}

/**
 * Address shape is validated per network: EVM chains use 0x-prefixed 20-byte
 * hex, Solana uses base58. Simulated, but wrong-network addresses are rejected
 * so the validation path is genuinely exercised.
 */
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const walletSchema = z.object({
  id: z.string(),
  kind: walletKindSchema,
  label: z.string(),
  provider: walletProviderSchema,
  network: networkSchema,
  address: z.string(),
})
export type Wallet = z.infer<typeof walletSchema>

export const walletInputSchema = z
  .object({
    kind: walletKindSchema,
    label: z.string().min(2, 'Informe um apelido para a carteira'),
    provider: walletProviderSchema,
    network: networkSchema,
    address: z.string().min(1, 'Informe o endereço da carteira'),
  })
  .refine(
    (input) =>
      input.network === 'solana'
        ? SOLANA_ADDRESS.test(input.address)
        : EVM_ADDRESS.test(input.address),
    {
      path: ['address'],
      message: 'Endereço incompatível com a rede selecionada',
    },
  )
export type WalletInput = z.infer<typeof walletInputSchema>
