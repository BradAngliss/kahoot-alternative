import { Question } from '@/types/types'

/** "3 / 7" with a progress bar, at the top of the quiz screens */
export default function QuestionProgress({
  question,
  questionCount,
}: {
  question: Question
  questionCount: number
}) {
  const current = question.order + 1

  return (
    <div className="flex items-center gap-3">
      <span className="pill font-display tabular-nums">
        {current} / {questionCount}
      </span>
      <div
        className="h-2 flex-grow overflow-hidden rounded-full bg-white/20"
        role="progressbar"
        aria-label="Question progress"
        aria-valuemin={1}
        aria-valuemax={questionCount}
        aria-valuenow={current}
      >
        <div
          className="h-full rounded-full bg-choice-yellow transition-all"
          style={{ width: `${(current * 100) / questionCount}%` }}
        ></div>
      </div>
    </div>
  )
}
