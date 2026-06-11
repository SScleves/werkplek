import { Volume2 } from 'lucide-react'
import { canSpeak, speakDutch } from '../../lib/speech'

export function SpeakButton({
  text,
  size = 18,
  className = '',
}: {
  text: string
  size?: number
  className?: string
}) {
  if (!canSpeak()) return null
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        speakDutch(text)
      }}
      className={`rounded-lg p-1.5 text-[var(--color-muted)] transition hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)] ${className}`}
      aria-label={`Pronounce "${text}"`}
      title="Pronounce"
    >
      <Volume2 size={size} />
    </button>
  )
}
