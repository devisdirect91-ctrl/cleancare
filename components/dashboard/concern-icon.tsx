import {
  CircleDot,
  CloudFog,
  Droplets,
  Flame,
  Sparkles,
  Sun,
  Waves,
  type LucideIcon,
} from 'lucide-react'

interface ConcernInfo {
  icon: LucideIcon
  label: string
  explanation: string
}

const CONCERN_INFO: Record<string, ConcernInfo> = {
  acné_légère: {
    icon: Sparkles,
    label: 'Acné légère',
    explanation:
      'Quelques imperfections superficielles, sans inflammation marquée.',
  },
  déshydratation: {
    icon: Droplets,
    label: 'Déshydratation',
    explanation:
      'Le film hydrolipidique manque d’eau — la peau tire et perd en confort.',
  },
  pores_dilatés: {
    icon: CircleDot,
    label: 'Pores dilatés',
    explanation:
      'Une production de sébum plus marquée rend les pores plus visibles, surtout en zone T.',
  },
  rougeurs: {
    icon: Flame,
    label: 'Rougeurs',
    explanation:
      'Une sensibilité réactive crée des zones de rougeur ponctuelles ou diffuses.',
  },
  ridules: {
    icon: Waves,
    label: 'Ridules',
    explanation:
      'De fines lignes d’expression apparaissent, souvent liées à la déshydratation.',
  },
  taches: {
    icon: Sun,
    label: 'Taches',
    explanation:
      'Des zones d’hyperpigmentation localisées, fréquemment dues au soleil.',
  },
  ternissement: {
    icon: CloudFog,
    label: 'Ternissement',
    explanation:
      'Le renouvellement cellulaire ralentit, le teint paraît moins lumineux.',
  },
}

export function getConcernInfo(concern: string): ConcernInfo {
  return (
    CONCERN_INFO[concern] ?? {
      icon: Sparkles,
      label: concern.replace(/_/g, ' '),
      explanation: 'Un point à surveiller dans ta routine.',
    }
  )
}
