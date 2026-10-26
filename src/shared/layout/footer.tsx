import { Wordmark } from '@/shared/layout/wordmark'
import {
  COMPATIBLE_WALLETS,
  FOOTER_COLUMNS,
  FOOTER_HIGHLIGHTS,
  FOOTER_SOCIALS,
} from '@/shared/layout/footer-data'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

/**
 * Desktop footer from the Figma, with four layout corrections (all logged in
 * ARCHITECTURE.md):
 *
 * 1. The highlight columns had mismatched widths (one flexible, two fixed at
 *    264.667px) — equalised to a four-track grid.
 * 2. "Carteiras compatíveis" overflowed its 228px column — the column now sizes
 *    to content and the heading wraps.
 * 3. The wallet chip had `pl-8 pr-0`, clipping "COINBASE" — symmetric padding,
 *    and the chips wrap instead of overflowing.
 * 4. The newsletter field had left padding only, so the value collided with the
 *    submit button — the input now reserves room for it.
 */
export function Footer() {
  return (
    <footer className="mt-auto w-full">
      <div className="bg-card">
        <div className="mx-auto grid w-full max-w-shell grid-cols-1 gap-x-8 gap-y-10 px-5 py-8 md:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.2fr)]">
          {FOOTER_HIGHLIGHTS.map((highlight, index) => (
            <section
              key={highlight.title}
              className={
                index > 0 ? 'lg:border-l lg:border-primary/60 lg:pl-8' : undefined
              }
            >
              <div
                aria-hidden="true"
                className="flex size-18.5 items-center justify-center rounded-full bg-primary text-ink"
              >
                <highlight.Icon className="size-8" />
              </div>
              <h2 className="mt-3 text-body-xl font-bold text-foreground">
                {highlight.title}
              </h2>
              <p className="mt-3 max-w-[26ch] text-body leading-5.5 text-text-secondary">
                {highlight.body}
              </p>
            </section>
          ))}

          <section className="lg:border-l lg:border-primary/60 lg:pl-8">
            <h2 className="text-body-2xl font-bold text-foreground">
              Antecipe-se ao próximo lançamento
            </h2>
            <NewsletterForm />
            <p className="mt-3 text-caption-lg leading-[22px] text-text-secondary">
              Receba lançamentos selecionados, histórias de criadores e novidades do
              mercado.
            </p>
          </section>
        </div>
      </div>

      <div className="bg-secondary">
        <div className="mx-auto grid w-full max-w-shell grid-cols-1 items-center gap-4 px-5 py-6 sm:grid-cols-2 lg:grid-cols-4">
          <Wordmark />
          <p className="text-body leading-[22px] text-foreground">
            Feito para colecionadores,
            <br />
            criadores e cultura
          </p>
          <a
            href="mailto:contato@kurio.test"
            className="rounded-sm text-body text-foreground transition-colors hover:text-text-accent"
          >
            contato@kurio.test
          </a>
          <a
            href="tel:+551140028922"
            className="rounded-sm text-body text-foreground transition-colors hover:text-text-accent"
          >
            +55 11 4002 8922
          </a>
        </div>
      </div>

      <div className="bg-card">
        <div className="mx-auto grid w-full max-w-shell grid-cols-1 gap-x-12 gap-y-10 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-body-2xl font-bold text-foreground">{column.title}</h2>
              <ul className="mt-2">
                {column.links.map((link) => (
                  <li key={link}>
                    {/*
                      These destinations are outside the delivery scope. They are
                      rendered as inert text rather than links to nowhere.
                    */}
                    <span
                      aria-disabled="true"
                      className="block text-body leading-[30px] text-foreground/70"
                    >
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-body-2xl font-bold text-foreground">Redes sociais</h2>
              <ul className="mt-5 flex flex-wrap items-center gap-2.5">
                {FOOTER_SOCIALS.map(({ label, Icon }) => (
                  <li key={label}>
                    <span
                      aria-disabled="true"
                      title="Perfil externo fora do escopo desta entrega"
                      className="flex size-[30px] items-center justify-center rounded-md border border-border-soft bg-secondary text-primary"
                    >
                      <Icon className="size-[30px]" aria-hidden="true" />
                      <span className="sr-only">{label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-body-2xl font-bold text-foreground">
                Carteiras compatíveis
              </h2>
              <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-md border border-border-soft bg-secondary px-3 py-2">
                {COMPATIBLE_WALLETS.map((wallet, index) => (
                  <li
                    key={wallet}
                    className="text-tiny font-bold tracking-[0.1px] text-text-accent"
                  >
                    {index > 0 && (
                      <span aria-hidden="true" className="mr-2">
                        •
                      </span>
                    )}
                    {wallet}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <p className="px-5 pb-6 text-center text-body leading-[30px] text-foreground">
          © 2026 Kurio. Propriedade digital para todos.
        </p>
      </div>
    </footer>
  )
}

function NewsletterForm() {
  return (
    <form
      className="mt-4 flex w-full items-stretch"
      onSubmit={(event) => {
        // Newsletter signup is outside the delivery scope: the control is
        // present for fidelity but must not simulate a successful subscription.
        event.preventDefault()
      }}
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Seu e-mail para receber lançamentos
      </label>
      <Input
        id="newsletter-email"
        type="email"
        name="email"
        placeholder="digite seu e-mail..."
        disabled
        className="h-10 rounded-r-none border-r-0 border-border-soft bg-secondary text-foreground placeholder:text-brand-secondary"
      />
      <Button
        type="submit"
        disabled
        title="Newsletter fora do escopo desta entrega"
        className="h-10 rounded-l-none px-4 text-body-2xl font-bold"
      >
        Enviar
      </Button>
    </form>
  )
}
