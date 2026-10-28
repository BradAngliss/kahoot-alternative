import { CorrectIcon, IncorrectIcon } from '@/components/quiz-types/icons'
import QuestionProgress from '@/components/quiz-types/question-progress'
import { getQuizVariant } from '@/components/quiz-types/registry'
import { AnswerResponse, AnswerResult } from '@/components/quiz-types/types'
import { TIME_TIL_CHOICE_REVEAL } from '@/constants'
import { Question, supabase } from '@/types/types'
import { useState, useEffect } from 'react'
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

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const { PlayerView, scored } = getQuizVariant(question)

  useEffect(() => {
    setPlayerAnswer(null)
    setResult(null)
    setHasShownChoices(false)
  }, [question.id])

  const answer = async (response: AnswerResponse) => {
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
    <div className="h-screen flex flex-col items-stretch bg-slate-900 relative">
      <div className="text-center">
        <h2 className="pb-4 text-2xl bg-white font-bold mx-4 my-12 p-4 rounded inline-block md:text-3xl md:px-24">
          {question.body}
        </h2>
      </div>

      {!isAnswerRevealed && playerAnswer && (
        <div className="flex-grow flex justify-center items-center">
          <div className="text-white text-2xl text-center p-4">
            Wait for others to answer...
          </div>
        </div>
      )}

      {!hasShownChoices && !isAnswerRevealed && (
        <div className="flex-grow text-transparent flex justify-center">
          <CountdownCircleTimer
            onComplete={() => {
              setHasShownChoices(true)
            }}
            isPlaying
            duration={TIME_TIL_CHOICE_REVEAL / 1000}
            colors={['#fff', '#fff', '#fff', '#fff']}
            trailColor={'transparent' as ColorFormat}
            colorsTime={[7, 5, 2, 0]}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      )}

      {hasShownChoices && !isAnswerRevealed && !playerAnswer && (
        <div className="flex-grow flex flex-col items-stretch">
          <div className="flex-grow"></div>
          <PlayerView question={question} onAnswer={answer} />
        </div>
      )}

      {isAnswerRevealed && !scored && (
        <div className="flex-grow flex justify-center items-center">
          <h2 className="text-white text-2xl text-center p-4">
            {playerAnswer ? 'Thanks for voting' : 'You did not vote'}
          </h2>
        </div>
      )}

      {isAnswerRevealed && scored && (
        <div className="flex-grow flex justify-center items-center flex-col">
          <h2 className="text-white text-2xl text-center pb-2">
            {result?.isCorrect ? 'Correct' : isClose ? 'Close!' : 'Incorrect'}
          </h2>
          <div
            className={`text-white rounded-full p-4  ${
              result?.isCorrect
                ? 'bg-green-500'
                : isClose
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
          >
            {(result?.isCorrect || isClose) && <CorrectIcon />}
            {!result?.isCorrect && !isClose && <IncorrectIcon />}
          </div>
          {isClose && (
            <p className="text-white text-xl pt-2">+{result.score} points</p>
          )}
        </div>
      )}

      <QuestionProgress question={question} questionCount={questionCount} />
    </div>
  )
}
