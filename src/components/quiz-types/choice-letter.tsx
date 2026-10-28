import { choiceLetter } from './colors'

/** The A/B/C/D badge at the start of an answer tile */
export default function ChoiceLetter({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-white font-display text-base font-extrabold"
    >
      {choiceLetter(index)}
    </span>
  )
}
