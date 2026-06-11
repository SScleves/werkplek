/** Speak Dutch text with the browser's built-in TTS. No-ops if unsupported. */

let voice: SpeechSynthesisVoice | null | undefined // undefined = not looked up yet

function findDutchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((v) => v.lang === 'nl-NL') ??
    voices.find((v) => v.lang.startsWith('nl')) ??
    null
  )
}

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speakDutch(text: string): void {
  if (!canSpeak()) return
  // Voices can load asynchronously; re-check until we find one
  if (voice === undefined || voice === null) voice = findDutchVoice()

  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'nl-NL'
  if (voice) u.voice = voice
  u.rate = 0.85 // slightly slow for learners
  window.speechSynthesis.cancel() // don't queue up overlapping words
  window.speechSynthesis.speak(u)
}

// Warm the voice list (some browsers populate it lazily)
if (canSpeak()) {
  window.speechSynthesis.onvoiceschanged = () => {
    voice = findDutchVoice()
  }
}
