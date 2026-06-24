import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'LumiScan <hello@mira.app>'

export async function sendTrialEndingEmail(userId: string, email: string): Promise<void> {
  console.log(`[email] trial_will_end → ${email} (user ${userId})`)

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Ton essai LumiScan se termine dans 3 jours',
    html: `
      <p>Bonjour,</p>
      <p>Ton essai gratuit LumiScan se termine dans 3 jours.</p>
      <p>Pour continuer à accéder à ta routine personnalisée,
         active ton abonnement depuis ton espace.</p>
      <p>— L'équipe LumiScan</p>
    `,
  })
}

export async function sendPaymentFailedEmail(email: string): Promise<void> {
  console.log(`[email] payment_failed → ${email}`)

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Problème de paiement sur ton abonnement LumiScan',
    html: `
      <p>Bonjour,</p>
      <p>Nous n'avons pas pu débiter ta carte pour ton abonnement LumiScan.</p>
      <p>Mets à jour tes informations de paiement pour éviter
         l'interruption de ton accès.</p>
      <p>— L'équipe LumiScan</p>
    `,
  })
}
