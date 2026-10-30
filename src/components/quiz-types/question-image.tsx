/**
 * A question's picture, on the host's screen. It fills the space it's given
 * rather than asking for its own size, so it can't push the screen into scrolling.
 */
export default function QuestionImage({ url }: { url: string }) {
  return (
    <div className="card relative min-h-[8rem] flex-1 overflow-hidden lg:landscape:w-2/5 lg:landscape:flex-none">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Picture for this question"
        className="absolute inset-0 h-full w-full object-contain"
      />
    </div>
  )
}
