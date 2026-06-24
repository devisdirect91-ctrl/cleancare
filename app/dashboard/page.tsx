import { redirect } from 'next/navigation'

// L'ancien dashboard est remplacé par l'app à onglets. On redirige vers
// l'onglet Routine (la garde premium vit dans app/(app)/layout.tsx).
export default function DashboardPage() {
  redirect('/routine')
}
