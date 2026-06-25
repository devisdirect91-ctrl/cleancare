import type { Metadata } from 'next'
import { LegalPage, LegalSection } from '@/components/legal/legal-page'

export const metadata: Metadata = {
  title: 'Mentions légales · LumiScan',
}

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updatedAt="25 juin 2026">
      <LegalSection title="Éditeur du site">
        <p>
          Le site et l&apos;application <strong>LumiScan</strong> sont édités par
          [Raison sociale], [forme juridique] au capital de [montant] €,
          immatriculée au RCS de [ville] sous le numéro [SIREN].
        </p>
        <p>
          Siège social : [adresse complète].
          <br />
          Email : contact@lumiscan.fr
          <br />
          Directeur de la publication : [nom du responsable].
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Application hébergée par <strong>Vercel Inc.</strong>, 340 S Lemon Ave
          #4133, Walnut, CA 91789, États-Unis.
        </p>
        <p>
          Base de données, authentification et stockage des fichiers assurés par{' '}
          <strong>Supabase</strong> (Supabase, Inc.).
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          L&apos;ensemble des contenus (marque, logo, textes, interface,
          visuels) est la propriété exclusive de l&apos;éditeur ou de ses
          partenaires. Toute reproduction sans autorisation est interdite.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Pour toute question : contact@lumiscan.fr. Pour les questions relatives
          à tes données personnelles, consulte notre Politique de
          confidentialité.
        </p>
      </LegalSection>

      <p className="border-t border-[#E5DCC8] pt-5 text-[12px] italic text-stone">
        Modèle à compléter et à faire valider juridiquement avant publication
        (champs entre crochets à renseigner).
      </p>
    </LegalPage>
  )
}
