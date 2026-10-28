import { CorrectIcon, IncorrectIcon } from '@/components/quiz-types/icons'
import QuestionCard from '@/components/quiz-types/question-card'
import QuestionProgress from '@/components/quiz-types/question-progress'
import { getQuizVariant } from '@/components/quiz-types/registry'
import { AnswerResponse, AnswerResult } from '@/components/quiz-types/types'
import { AUTO_SUBMIT_EARLY, TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Question, supabase } from '@/types/types'
import { useState, useEffect, useRef } from 'react'
import { ColorFormat, CountdownCircleTimer } from 'react-countdown-circle-timer'

export default function Quiz({
  question: question,
  questionCount: questionCount,
  participantId: playerId,
  isAnswerRevealed,
}: {
  question: Question
  questionCount: number
  participantId: string
  isAnswerRevealed: boolean
}) {
  const [playerAnswer, setPlayerAnswer] = useState<AnswerResponse | null>(null)

  const [result, setResult] = useState<AnswerResult | null>(null)

  // Both are stored as the question they happened on, so neither carries over
  // to the next question before the reset below runs
  const [choicesShownFor, setChoicesShownFor] = useState<string | null>(null)
  // Set just before time runs out, so unsubmitted answers are sent
  const [timeUpFor, setTimeUpFor] = useState<string | null>(null)

  const hasShownChoices = choicesShownFor === question.id
  const isTimeUp = timeUpFor === question.id

  // Stops a second submit, e.g. tapping Submit just as time runs out
  const isSubmittingRef = useRef(false)

  const { PlayerView, scored } = getQuizVariant(question)

  useEffect(() => {
    setPlayerAnswer(null)
    setResult(null)
    isSubmittingRef.current = false
  }, [question.id])

  useEffect(() => {
    if (!hasShownChoices) return
    const questionId = question.id
    const timeout = setTimeout(
      () => setTimeUpFor(questionId),
      question.time_limit_seconds * 1000 - AUTO_SUBMIT_EARLY
    )
    return () => clearTimeout(timeout)
  }, [hasShownChoices, question.id, question.time_limit_seconds])

  const answer = async (response: AnswerResponse) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setPlayerAnswer(response)

    // The database grades the answer and scores it by how long the player took
    const { data, error } = await supabase
      .rpc('submit_answer', {
        participant_id: playerId,
        question_id: question.id,
        response,
      })
      .single()
    if (error) {
      setPlayerAnswer(null)
      // An automatic submit that failed isn't retried (isSubmittingRef stays
      // set), and shouldn't interrupt the reveal with an alert
      if (isTimeUp) return console.error(error.message)
      isSubmittingRef.current = false
      return alert(error.message)
    }

    setResult({
      isCorrect: data.is_correct,
      correctness: data.correctness,
      score: data.score,
    })
  }

  // Partly right, e.g. a slider guess near the answer
  const isClose = !!result && !result.isCorrect && result.correctness > 0

  return (
    <div className="flex min-h-screen flex-col gap-6 px-4 py-6">
      <QuestionProgress question={question} questionCount={questionCount} />

      <QuestionCard body={question.body} />

      {!isAnswerRevealed && playerAnswer && (
        <div className="flex flex-grow items-center justify-center">
          <div className="card animate-pop-in px-8 py-6 text-center">
            <p className="font-display text-2xl font-extrabold">Answer locked in</p>
            <p className="pt-1 text-ink/70">Waiting for everyone else…</p>
          </div>
        </div>
      )}

      {!hasShownChoices && !isAnswerRevealed && (
        <div className="flex flex-grow items-center justify-center font-display text-5xl font-extrabold">
          <CountdownCircleTimer
            onComplete={() => {
              setChoicesShownFor(question.id)
            }}
            isPlaying
            duration={TIME_TIL_CHOICE_REVEAL / 1000}
            colors={['#ffc93c', '#ffc93c', '#ffc93c', '#ffc93c']}
            trailColor={'rgba(255,255,255,0.2)' as ColorFormat}
            colorsTime={[7, 5, 2, 0]}
            strokeWidth={10}
            size={160}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      )}

      {hasShownChoices && !isAnswerRevealed && !playerAnswer && (
        <div className="flex flex-grow flex-col justify-end">
          <PlayerView question={question} onAnswer={answer} isTimeUp={isTimeUp} />
        </div>
      )}

      {isAnswerRevealed && !scored && (
        <div className="flex flex-grow items-center justify-center">
          <div className="card animate-pop-in px-8 py-6 text-center">
            <p className="font-display text-2xl font-extrabold">
              {playerAnswer ? 'Thanks for voting' : 'You did not vote'}
            </p>
          </div>
        </div>
      )}

      {isAnswerRevealed && scored && (
        <div className="flex flex-grow items-center justify-center">
          <div className="card flex animate-pop-in flex-col items-center px-10 py-8 text-center">
            <div
              className={`rounded-full border-2 border-ink p-4 ${
                result?.isCorrect
                  ? 'bg-choice-green'
                  : isClose
                  ? 'bg-choice-yellow'
                  : 'bg-choice-red'
              }`}
            >
              {(result?.isCorrect || isClose) && <CorrectIcon />}
              {!result?.isCorrect && !isClose && <IncorrectIcon />}
            </div>
            <h2 className="pt-4 font-display text-3xl font-extrabold">
              {result?.isCorrect ? 'Correct' : isClose ? 'Close!' : 'Incorrect'}
            </h2>
            {result && result.score > 0 && (
              <p className="mt-3 rounded-full border-2 border-ink bg-choice-yellow px-4 py-1 font-display text-lg font-bold">
                +{result.score} points
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
