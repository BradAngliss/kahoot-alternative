import { Question } from '@/types/types'

export default function QuestionProgress({
  question,
  questionCount,
}: {
  question: Question
  questionCount: number
}) {
  return (
    <div className="flex text-white py-2 px-4 items-center bg-black">
      <div className="text-2xl">
        {question.order + 1}/{questionCount}
      </div>
    </div>
  )
}
