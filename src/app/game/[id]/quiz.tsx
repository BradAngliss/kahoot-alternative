import { CorrectIcon, IncorrectIcon } from '@/components/quiz-types/icons'
import QuestionProgress from '@/components/quiz-types/question-progress'
import { getQuizVariant } from '@/components/quiz-types/registry'
import { PlayerAnswer } from '@/components/quiz-types/types'
import { QUESTION_ANSWER_TIME, TIME_TIL_CHOICE_REVEAL } from '@/constants'
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
  const [playerAnswer, setPlayerAnswer] = useState<PlayerAnswer | null>(null)

  const [hasShownChoices, setHasShownChoices] = useState(false)

  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  const { PlayerView } = getQuizVariant(question)

  useEffect(() => {
    setPlayerAnswer(null)
    setHasShownChoices(false)
  }, [question.id])

  const answer = async (newAnswer: PlayerAnswer) => {
    setPlayerAnswer(newAnswer)

    const now = Date.now()
    const score = !newAnswer.isCorrect
      ? 0
      : 1000 -
        Math.round(
          Math.max(
            0,
            Math.min((now - questionStartTime) / QUESTION_ANSWER_TIME, 1)
          ) * 1000
        )

    const { error } = await supabase.from('answers').insert({
      participant_id: playerId,
      question_id: question.id,
      choice_id: newAnswer.choiceId,
      score,
    })
    if (error) {
      setPlayerAnswer(null)
      alert(error.message)
    }
  }

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
              setQuestionStartTime(Date.now())
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

      {isAnswerRevealed && (
        <div className="flex-grow flex justify-center items-center flex-col">
          <h2 className="text-white text-2xl text-center pb-2">
            {playerAnswer?.isCorrect ? 'Correct' : 'Incorrect'}
          </h2>
          <div
            className={`text-white rounded-full p-4  ${
              playerAnswer?.isCorrect ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {playerAnswer?.isCorrect && <CorrectIcon />}
            {!playerAnswer?.isCorrect && <IncorrectIcon />}
          </div>
        </div>
      )}

      <QuestionProgress question={question} questionCount={questionCount} />
    </div>
  )
}
