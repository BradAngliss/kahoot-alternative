'use client'

import { choiceColor } from '@/components/quiz-types/colors'
import { QUESTION_TYPE_LABELS } from '@/components/quiz-types/registry'
import { QuizSet, supabase } from '@/types/types'
import { useEffect, useState } from 'react'

export default function Home() {
  const [quizSet, setQuizSet] = useState<QuizSet[]>([])

  useEffect(() => {
    const getQuizSets = async () => {
      const { data, error } = await supabase
        .from('quiz_sets')
        .select(`*, questions(*, choices(*))`)
        .order('created_at', { ascending: false })
      if (error) {
        alert('Failed to fetch quiz sets')
        return
      }
      setQuizSet(data)
    }
    getQuizSets()
  }, [])

  const startGame = async (quizSetId: string) => {
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()

    if (!sessionData.session) {
      await supabase.auth.signInAnonymously()
    }

    const { data, error } = await supabase
      .from('games')
      .insert({
        quiz_set_id: quizSetId,
      })
      .select()
      .single()
    if (error) {
      console.error(error)
      alert('Failed to start game')
      return
    }

    const gameId = data.id
    window.open(`/host/game/${gameId}`, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className="pb-6">
        <h1 className="font-display text-4xl font-extrabold">Your quizzes</h1>
        <p className="pt-1 text-ink/70">
          Pick a quiz to host. It opens in a new tab with a QR code for players to join.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quizSet.map((quizSet, index) => {
          // Each question type used in the quiz, in order of first use
          const types = Array.from(
            new Set(
              [...quizSet.questions]
                .sort((a, b) => a.order - b.order)
                .map((question) => question.type)
            )
          )

          return (
            <div key={quizSet.id} className="card flex flex-col overflow-hidden">
              <div
                className={`flex h-28 items-end border-b-2 border-ink p-4 ${choiceColor(
                  index % 4
                )}`}
              >
                <span className="rounded-lg border-2 border-ink bg-white px-2 py-0.5 text-sm font-bold">
                  {quizSet.questions.length} questions
                </span>
              </div>
              <div className="flex flex-grow flex-col gap-3 p-4">
                <div>
                  <h2 className="font-display text-xl font-extrabold leading-tight">
                    {quizSet.name}
                  </h2>
                  {quizSet.description && (
                    <p className="pt-1 text-sm text-ink/70">{quizSet.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {types.map((type) => (
                    <span
                      key={type}
                      className="rounded-full bg-mist px-2.5 py-0.5 text-xs font-semibold text-ink/80"
                    >
                      {QUESTION_TYPE_LABELS[type]}
                    </span>
                  ))}
                </div>
                <button
                  className="btn btn-dark mt-auto w-full"
                  onClick={() => startGame(quizSet.id)}
                >
                  Host game
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
