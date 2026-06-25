import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Conditions générales · LumiScan',
}

export default function CguPage() {
  return (
    <LegalPage
      title="Conditions générales d’utilisation et de vente"
      updatedAt="25 juin 2026"
    >
      <LegalSection title="1. Objet">
        <p>
          Les présentes conditions régissent l&apos;accès et l&apos;utilisation
          de LumiScan, service d&apos;analyse cosmétique de la peau par
          intelligence artificielle et de recommandation de routine. En créant un
          compte, tu acceptes ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="2. Nature du service (non médical)">
        <p>
          LumiScan fournit des recommandations <strong>cosmétiques</strong> à
          visée informative et de confort. Le service ne constitue{' '}
          <strong>en aucun cas un avis, diagnostic ou traitement médical</strong>{' '}
          ou dermatologique. En cas de doute, de lésion ou de condition
          persistante, consulte un professionnel de santé.
        </p>
      </LegalSection>

      <LegalSection title="3. Compte">
        <p>
          Tu es responsable de l&apos;exactitude des informations fournies et de
          la confidentialité de tes identifiants. Le service est réservé aux
          personnes de 16 ans ou plus.
        </p>
      </LegalSection>

      <LegalSection title="4. Essai gratuit et abonnement">
        <p>
          L&apos;abonnement débute par un <strong>essai gratuit de 7 jours</strong>.
          Aucune somme n&apos;est prélevée pendant cette période. À l&apos;issue
          des 7 jours, et sauf résiliation avant la fin de l&apos;essai,
          l&apos;abonnement est facturé automatiquement selon la formule choisie :
          <strong> 7,99 €/mois</strong> ou <strong>49 €/an</strong>. Une carte
          bancaire est requise à l&apos;inscription.
        </p>
        <p>
          L&apos;abonnement est reconduit tacitement pour des périodes
          successives identiques. Tu peux résilier à tout moment depuis ton
          espace ; la résiliation prend effet à la fin de la période en cours et
          aucun remboursement au prorata n&apos;est dû pour la période entamée.
          Les paiements sont traités de façon sécurisée par{' '}
          <strong>Stripe</strong> ; nous ne stockons pas tes données bancaires.
        </p>
        <p>
          L&apos;offre « accès à vie » est un paiement unique donnant accès aux
          fonctionnalités pour la durée d&apos;exploitation du service.
        </p>
      </LegalSection>

      <LegalSection title="5. Droit de rétractation">
        <p>
          S&apos;agissant d&apos;un contenu et service numérique fourni
          immédiatement, tu bénéficies de l&apos;essai gratuit pour évaluer le
          service. En demandant l&apos;exécution immédiate, tu reconnais que le
          droit de rétractation de 14 jours ne peut plus être exercé une fois le
          service pleinement fourni, conformément à l&apos;article L.221-28 du
          Code de la consommation.
        </p>
      </LegalSection>

      <LegalSection title="6. Responsabilité">
        <p>
          Les recommandations sont générées automatiquement à partir d&apos;une
          photo et peuvent comporter des imprécisions. Elles ne remplacent pas
          ton propre jugement ni un avis professionnel. Notre responsabilité ne
          saurait être engagée pour une réaction cutanée liée à l&apos;usage
          d&apos;un produit ; fais toujours un test de tolérance.
        </p>
      </LegalSection>

      <LegalSection title="7. Données personnelles">
        <p>
          Le traitement de tes données (dont les photos) est décrit dans notre
          Politique de confidentialité, que nous t&apos;invitons à consulter.
        </p>
      </LegalSection>

      <LegalSection title="8. Droit applicable et litiges">
        <p>
          Les présentes conditions sont soumises au droit français. En cas de
          litige, tu peux recourir gratuitement à un médiateur de la
          consommation avant toute action judiciaire. À défaut de résolution
          amiable, les tribunaux français sont compétents.
        </p>
      </LegalSection>

      <p className="border-t border-[#E5DCC8] pt-5 text-[12px] italic text-stone">
        Modèle fourni à titre indicatif, à faire valider par un professionnel du
        droit avant mise en production.
      </p>
    </LegalPage>
  )
}
