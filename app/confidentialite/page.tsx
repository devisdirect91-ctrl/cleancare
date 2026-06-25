import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Politique de confidentialité · LumiScan',
}

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="25 juin 2026">
      <LegalSection title="Responsable du traitement">
        <p>
          LumiScan ([Raison sociale]) est responsable du traitement de tes
          données personnelles. Contact : contact@lumiscan.fr.
        </p>
      </LegalSection>

      <LegalSection title="Données que nous collectons">
        <p>— Compte : email, mot de passe (haché), prénom.</p>
        <p>
          — Analyse : la photo de ton visage et les résultats générés (type de
          peau, sous-ton, hydratation, routine, etc.).
        </p>
        <p>
          — Abonnement : données de facturation gérées par Stripe (nous ne
          stockons pas ton numéro de carte).
        </p>
        <p>— Usage : événements d&apos;utilisation et données techniques.</p>
      </LegalSection>

      <LegalSection title="Finalités et bases légales">
        <p>— Fournir le service et ta routine (exécution du contrat).</p>
        <p>— Analyser ta photo (ton consentement, retiré à tout moment).</p>
        <p>— Gérer l&apos;abonnement et la facturation (obligation contractuelle et légale).</p>
        <p>— Améliorer le produit et mesurer l&apos;audience (intérêt légitime).</p>
      </LegalSection>

      <LegalSection title="Tes photos">
        <p>
          Tes photos sont utilisées uniquement pour générer ton analyse. Elles
          sont <strong>supprimées automatiquement après 30 jours</strong> et ne
          sont jamais revendues ni utilisées à des fins publicitaires.
        </p>
      </LegalSection>

      <LegalSection title="Sous-traitants et destinataires">
        <p>Nous nous appuyons sur des prestataires sélectionnés :</p>
        <p>— <strong>Supabase</strong> : hébergement de la base, authentification, stockage des photos.</p>
        <p>— <strong>Anthropic (Claude)</strong> : analyse de la photo par IA.</p>
        <p>— <strong>Stripe</strong> : paiement et abonnement.</p>
        <p>— <strong>Resend</strong> : envoi des emails.</p>
        <p>— <strong>PostHog</strong> : mesure d&apos;audience (champs sensibles masqués).</p>
        <p>— <strong>Vercel</strong> : hébergement de l&apos;application.</p>
      </LegalSection>

      <LegalSection title="Transferts hors Union européenne">
        <p>
          Certains prestataires sont situés hors UE (notamment aux États-Unis).
          Ces transferts sont encadrés par des garanties appropriées (clauses
          contractuelles types de la Commission européenne).
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Compte et analyses : conservés tant que ton compte est actif. Photos :
          30 jours maximum. Données de facturation : selon les obligations
          légales comptables.
        </p>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Tu disposes des droits d&apos;accès, de rectification, d&apos;effacement,
          de portabilité, d&apos;opposition et de retrait du consentement. Pour
          les exercer : contact@lumiscan.fr. Tu peux aussi introduire une
          réclamation auprès de la CNIL (cnil.fr).
        </p>
      </LegalSection>

      <LegalSection title="Cookies et traceurs">
        <p>
          Nous utilisons des traceurs de mesure d&apos;audience (PostHog) pour
          comprendre l&apos;usage et améliorer le service. Les champs de
          formulaire sensibles sont masqués dans les enregistrements.
        </p>
      </LegalSection>

      <p className="border-t border-[#E5DCC8] pt-5 text-[12px] italic text-stone">
        Modèle fourni à titre indicatif, à adapter à ta structure et à faire
        valider juridiquement avant publication.
      </p>
    </LegalPage>
  )
}
