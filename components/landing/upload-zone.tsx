'use client'

import { Camera } from 'lucide-react'
import { useRef } from 'react'

interface UploadZoneProps {
  onFileSelected: (dataUrl: string) => void
}

export function UploadZone({ onFileSelected }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onFileSelected(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        onChange={handleChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="group flex w-full flex-col items-center justify-center gap-4 rounded-[28px] border-2 border-dashed border-terracotta/50 bg-white/40 px-6 py-14 text-center transition-colors duration-300 hover:border-terracotta hover:bg-white/70"
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 transition-transform duration-300 group-hover:scale-105">
          <Camera className="h-7 w-7 text-terracotta" strokeWidth={1.5} />
        </span>
        <span className="font-display text-lg text-charcoal">
          Touche pour uploader ta photo
        </span>
        <span className="font-mono text-xs uppercase tracking-wide text-stone">
          Format JPG, PNG · 5MB max
        </span>
      </button>
      <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-wide text-stone">
        Tes photos ne sont jamais stockées sans ton accord
      </p>
    </div>
  )
}
