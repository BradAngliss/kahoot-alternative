'use client'

import React, { FormEvent, useEffect, useRef, useState } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { Choice, Game, Participant, Question, supabase } from '@/types/types'
import Lobby from './lobby'
import Quiz from './quiz'

enum Screens {
  lobby = 'lobby',
  quiz = 'quiz',
  results = 'result',
}

export default function Home({
  params: { id: gameId },
}: {
  params: { id: string }
}) {
  const onRegisterCompleted = (participant: Participant) => {
    setParticipant(participant)
    getGame()
  }

  const stateRef = useRef<Participant | null>()

  const [participant, setParticipant] = useState<Participant | null>()

  stateRef.current = participant

  const [currentScreen, setCurrentScreen] = useState(Screens.lobby)

  const [questions, setQuestions] = useState<Question[]>()

  const [currentQuestionSequence, setCurrentQuestionSequence] = useState(0)
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false)

  const getGame = async () => {
    const { data: game } = await supabase
      .from('games')
      .select()
      .eq('id', gameId)
      .single()
    if (!game) return
    setCurrentScreen(game.phase as Screens)
    if (game.phase == Screens.quiz) {
      setCurrentQuestionSequence(game.current_question_sequence)
      setIsAnswerRevealed(game.is_answer_revealed)
    }

    getQuestions(game.quiz_set_id)
  }

  const getQuestions = async (quizSetId: string) => {
    const { data, error } = await supabase
      .from('questions')
      .select(`*, choices(*)`)
      .eq('quiz_set_id', quizSetId)
      .order('order', { ascending: true })
    if (error) {
      getQuestions(quizSetId)
      return
    }
    setQuestions(data)
  }

  useEffect(() => {
    const setGameListner = (): RealtimeChannel => {
      return supabase
        .channel('game_participant')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'games',
            filter: `id=eq.${gameId}`,
          },
          (payload) => {
            if (!stateRef.current) return

            // start the quiz game
            const game = payload.new as Game

            if (game.phase == 'result') {
              setCurrentScreen(Screens.results)
            } else {
              setCurrentScreen(Screens.quiz)
              setCurrentQuestionSequence(game.current_question_sequence)
              setIsAnswerRevealed(game.is_answer_revealed)
            }
          }
        )
        .subscribe()
    }

    const gameChannel = setGameListner()
    return () => {
      supabase.removeChannel(gameChannel)
    }
  }, [gameId])

  return (
    <main className="stage">
      {currentScreen == Screens.lobby && (
        <Lobby
          onRegisterCompleted={onRegisterCompleted}
          gameId={gameId}
        ></Lobby>
      )}
      {currentScreen == Screens.quiz && questions && (
        <Quiz
          question={questions![currentQuestionSequence]}
          questionCount={questions!.length}
          participantId={participant!.id}
          isAnswerRevealed={isAnswerRevealed}
        ></Quiz>
      )}
      {currentScreen == Screens.results && (
        <Results participant={participant!} gameId={gameId}></Results>
      )}
    </main>
  )
}

function Results({
  participant,
  gameId,
}: {
  participant: Participant
  gameId: string
}) {
  // This player's place and points, once the results are in
  const [standing, setStanding] = useState<{
    rank: number
    totalScore: number
  } | null>(null)

  useEffect(() => {
    const getStanding = async () => {
      const { data } = await supabase
        .from('game_results')
        .select()
        .eq('game_id', gameId)
        .order('total_score', { ascending: false })
      const index =
        data?.findIndex((result) => result.participant_id === participant.id) ??
        -1
      if (data && index >= 0) {
        setStanding({ rank: index + 1, totalScore: data[index].total_score ?? 0 })
      }
    }
    getStanding()
  }, [gameId, participant.id])

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div className="card w-full max-w-sm animate-pop-in p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-ink/60">
          Game over
        </p>
        <h2 className="break-words py-2 font-display text-4xl font-extrabold">
          {participant.nickname}
        </h2>
        {standing && (
          <div className="flex justify-center gap-3 py-4">
            <div className="rounded-xl border-2 border-ink bg-choice-yellow px-5 py-3">
              <div className="font-display text-3xl font-extrabold">
                #{standing.rank}
              </div>
              <div className="text-sm font-semibold">Place</div>
            </div>
            <div className="rounded-xl border-2 border-ink bg-choice-green px-5 py-3">
              <div className="font-display text-3xl font-extrabold tabular-nums">
                {standing.totalScore}
              </div>
              <div className="text-sm font-semibold">Points</div>
            </div>
          </div>
        )}
        <p className="text-ink/70">Thanks for playing 🎉</p>
      </div>
    </div>
  )
}
