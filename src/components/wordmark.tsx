/** The SupaQuiz name, used as the logo */
export default function Wordmark({
  tone = 'light',
  className = '',
}: {
  /** light for violet backgrounds, dark for the dashboard */
  tone?: 'light' | 'dark'
  className?: string
}) {
  return (
    <span
      className={`font-display text-2xl font-extrabold tracking-tight ${
        tone === 'light' ? 'text-white' : 'text-ink'
      } ${className}`}
    >
      Supa
      <span className="rounded-md border-2 border-ink bg-choice-yellow px-1.5 text-ink">
        Quiz
      </span>
    </span>
  )
}
