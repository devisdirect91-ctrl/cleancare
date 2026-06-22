import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Mira <hello@mira.app>'

export async function sendTrialEndingEmail(userId: string, email: string): Promise<void> {
  console.log(`[email] trial_will_end → ${email} (user ${userId})`)

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Ton essai Mira se termine dans 3 jours',
    html: `
      <p>Bonjour,</p>
      <p>Ton essai gratuit Mira se termine dans 3 jours.</p>
      <p>Pour continuer à accéder à ta routine personnalisée,
         active ton abonnement depuis ton espace.</p>
      <p>— L'équipe Mira</p>
    `,
  })
}

export async function sendPaymentFailedEmail(email: string): Promise<void> {
  console.log(`[email] payment_failed → ${email}`)

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Problème de paiement sur ton abonnement Mira',
    html: `
      <p>Bonjour,</p>
      <p>Nous n'avons pas pu débiter ta carte pour ton abonnement Mira.</p>
      <p>Mets à jour tes informations de paiement pour éviter
         l'interruption de ton accès.</p>
      <p>— L'équipe Mira</p>
    `,
  })
}
