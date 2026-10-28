import QuestionProgress from '@/components/quiz-types/question-progress'
import { getQuizVariant } from '@/components/quiz-types/registry'
import { TIME_TIL_CHOICE_REVEAL, TIME_TIL_NEXT_QUESTION } from '@/constants'
import { Answer, Participant, Question, supabase } from '@/types/types'
import { useEffect, useRef, useState } from 'react'
import { CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  gameId,
  participants,
}: {
  question: Question
  questionCount: number
  gameId: string
  participants: Participant[]
}) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [answers, setAnswers] = useState<Answer[]>([])

  const answerStateRef = useRef<Answer[]>()

  answerStateRef.current = answers

  const { HostView, RevealView } = getQuizVariant(question)

  // Seconds left before moving on automatically, while the answer is shown
  const [secondsUntilNext, setSecondsUntilNext] = useState<number | null>(null)

  // The question already moved on from, so pressing Next as the countdown
  // ends only moves on once
  const advancedFromRef = useRef<string | null>(null)

  const getNextQuestion = async () => {
    if (advancedFromRef.current === question.id) return
    advancedFromRef.current = question.id

    var updateData
    if (questionCount == question.order + 1) {
      updateData = { phase: 'result' }
    } else {
      updateData = {
        current_question_sequence: question.order + 1,
        is_answer_revealed: false,
      }
    }

    const { data, error } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
    if (error) {
      // Let the host try again with Next
      advancedFromRef.current = null
      return alert(error.message)
    }
  }

  // Latest getNextQuestion, so the countdown below doesn't restart every render
  const getNextQuestionRef = useRef(getNextQuestion)
  getNextQuestionRef.current = getNextQuestion

  const onTimeUp = async () => {
    setIsAnswerRevealed(true)
    await supabase
      .from('games')
      .update({
        is_answer_revealed: true,
      })
      .eq('id', gameId)
  }

  useEffect(() => {
    setIsAnswerRevealed(false)
    setHasShownChoices(false)
    setAnswers([])

    setTimeout(() => {
      setHasShownChoices(true)
    }, TIME_TIL_CHOICE_REVEAL)

    const channel = supabase
      .channel('answers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          setAnswers((currentAnswers) => {
            return [...currentAnswers, payload.new as Answer]
          })

          if (
            (answerStateRef.current?.length ?? 0) + 1 ===
            participants.length
          ) {
            onTimeUp()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [question.id])

  // Once the answer is shown, count down and move on to the next question
  useEffect(() => {
    if (!isAnswerRevealed) {
      setSecondsUntilNext(null)
      return
    }

    let remaining = TIME_TIL_NEXT_QUESTION / 1000
    setSecondsUntilNext(remaining)
    const interval = setInterval(() => {
      remaining -= 1
      setSecondsUntilNext(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        getNextQuestionRef.current()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isAnswerRevealed, question.id])

  return (
    <div className="h-screen flex flex-col items-stretch bg-slate-900 relative">
      <div className="absolute right-4 top-4">
        {isAnswerRevealed && (
          <button
            className="p-2 bg-white text-black rounded hover:bg-gray-200"
            onClick={getNextQuestion}
          >
            {secondsUntilNext === null ? 'Next' : `Next in ${secondsUntilNext}s`}
          </button>
        )}
      </div>

      <div className="text-center">
        <h2 className="pb-4 text-3xl bg-white font-bold mx-24 my-12 p-4 rounded inline-block">
          {question.body}
        </h2>
      </div>

      <div className="flex-grow text-white px-8">
        {hasShownChoices && !isAnswerRevealed && (
          <div className="flex justify-between items-center">
            <div className="text-5xl">
              <CountdownCircleTimer
                onComplete={() => {
                  onTimeUp()
                }}
                isPlaying
                duration={20}
                colors={['#004777', '#F7B801', '#A30000', '#A30000']}
                colorsTime={[7, 5, 2, 0]}
              >
                {({ remainingTime }) => remainingTime}
              </CountdownCircleTimer>
            </div>
            <div className="text-center">
              <div className="text-6xl pb-4">{answers.length}</div>
              <div className="text-3xl">Answers</div>
            </div>
          </div>
        )}
        {isAnswerRevealed && (
          <RevealView question={question} answers={answers} />
        )}
      </div>

      {hasShownChoices && (
        <HostView question={question} isAnswerRevealed={isAnswerRevealed} />
      )}

      <QuestionProgress question={question} questionCount={questionCount} />
    </div>
  )
}
