/** The question text, in a white card */
export default function QuestionCard({
  body,
  size = 'md',
}: {
  body: string
  /** lg for the host's big screen */
  size?: 'md' | 'lg'
}) {
  return (
    <div className="card animate-pop-in px-6 py-5 text-center">
      <h2
        className={`font-display font-extrabold leading-tight ${
          size === 'lg' ? 'text-3xl md:text-5xl' : 'text-2xl md:text-3xl'
        }`}
      >
        {body}
      </h2>
    </div>
  )
}
