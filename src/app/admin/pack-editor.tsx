import { QuizSet } from '@/types/types'
import { FormEvent, useEffect, useState } from 'react'
import { QuestionDraft, fromQuestion, newQuestion, packProblems, toPayload } from './draft'
import { removeImages, uploadImage } from './images'
import QuestionEditor from './question-editor'
import { adminSupabase } from './supabase'

/** A saved pack to edit, with its games so the editor can warn about running ones. */
export type EditablePack = QuizSet & { games: { phase: string; created_at: string }[] }

const DAY = 24 * 60 * 60 * 1000

const snapshot = (name: string, description: string, questions: QuestionDraft[]) =>
  JSON.stringify([name.trim(), description.trim(), toPayload(questions)])

/** Remount with a new key to start over. Creates a pack, or edits one when given it. */
export default function PackEditor({
  pack,
  onSaved,
  onCancel,
  onDirtyChange,
}: {
  pack?: EditablePack
  onSaved: (name: string) => void
  onCancel: () => void
  onDirtyChange: (isDirty: boolean) => void
}) {
  const [name, setName] = useState(pack?.name ?? '')
  const [description, setDescription] = useState(pack?.description ?? '')
  const [questions, setQuestions] = useState<QuestionDraft[]>(() =>
    pack
      ? [...pack.questions].sort((a, b) => a.order - b.order).map(fromQuestion)
      : [newQuestion()]
  )
  const [problems, setProblems] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [initial] = useState(() => snapshot(name, description, questions))

  // A pack can be a lot of typing, so warn before leaving with it unsaved
  const isDirty = snapshot(name, description, questions) !== initial
  useEffect(() => {
    onDirtyChange(isDirty)
    if (!isDirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [isDirty, onDirtyChange])

  // Games are never closed if the host just leaves, so old unfinished ones don't count
  const [now] = useState(() => Date.now())
  const runningGames =
    pack?.games.filter(
      (game) => game.phase !== 'result' && now - new Date(game.created_at).getTime() < DAY
    ).length ?? 0

  const save = async (e: FormEvent) => {
    e.preventDefault()

    const found = packProblems(name, questions)
    setProblems(found)
    if (found.length > 0) return

    setIsSaving(true)

    // Uploaded only now, so abandoning the form leaves no unused files behind
    const uploads = await Promise.allSettled(
      questions.map((question) => (question.imageFile ? uploadImage(question.imageFile) : null))
    )
    const uploaded = uploads.flatMap((upload) =>
      upload.status === 'fulfilled' && upload.value ? [upload.value] : []
    )
    if (uploads.some((upload) => upload.status === 'rejected')) {
      await removeImages(uploaded)
      setIsSaving(false)
      setProblems(["Couldn't upload an image. Check your connection and try again"])
      return
    }

    const saved = questions.map((question, index) => {
      const upload = uploads[index]
      return upload.status === 'fulfilled' && upload.value
        ? { ...question, imageUrl: upload.value }
        : question
    })

    const fields = {
      name: name.trim(),
      description: description.trim(),
      questions: toPayload(saved),
    }

    const { error } = pack
      ? await adminSupabase.rpc('update_quiz_set', { quiz_set_id: pack.id, ...fields })
      : await adminSupabase.rpc('create_quiz_set', fields)

    if (error) {
      await removeImages(uploaded)
      setIsSaving(false)
      setProblems([error.message])
      return
    }

    // Pictures that were replaced or removed, or whose question was
    const kept = saved.map((question) => question.imageUrl)
    await removeImages(
      (pack?.questions ?? []).flatMap((question) =>
        question.image_url && !kept.includes(question.image_url) ? [question.image_url] : []
      )
    )

    setIsSaving(false)
    onSaved(name.trim())
  }

  return (
    <form className="space-y-6" onSubmit={save} noValidate>
      {pack && (
        <div className="space-y-2 rounded-2xl border-2 border-ink bg-white p-4 text-sm">
          <p>
            Past scores are kept when you edit a question. Removing a question also removes its
            points from past game results.
          </p>
          {runningGames > 0 && (
            <p role="alert" className="font-bold">
              {runningGames} {runningGames === 1 ? 'game' : 'games'} started in the last 24 hours
              with this pack {runningGames === 1 ? "hasn't" : "haven't"} finished. Saving now could
              disrupt {runningGames === 1 ? 'it' : 'them'} if still being played.
            </p>
          )}
        </div>
      )}

      <section className="card space-y-3 p-4">
        <label className="block text-sm font-semibold text-ink/70">
          Pack name
          <input
            className="input mt-1 py-2 text-base shadow-none"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="block text-sm font-semibold text-ink/70">
          Description (optional)
          <input
            className="input mt-1 py-2 text-base shadow-none"
            value={description}
            maxLength={300}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </section>

      {questions.map((question, index) => (
        <QuestionEditor
          key={question.key}
          question={question}
          index={index}
          count={questions.length}
          onChange={(next) =>
            setQuestions(questions.map((other) => (other.key === question.key ? next : other)))
          }
          onMove={(other) => {
            const next = [...questions]
            ;[next[index], next[other]] = [next[other], next[index]]
            setQuestions(next)
          }}
          onRemove={() => setQuestions(questions.filter((other) => other.key !== question.key))}
        />
      ))}

      <button
        type="button"
        className="btn btn-primary w-full"
        onClick={() => setQuestions([...questions, newQuestion()])}
      >
        Add question
      </button>

      {problems.length > 0 && (
        <div role="alert" className="rounded-2xl border-2 border-ink bg-choice-red/20 p-4">
          <p className="font-bold">Fix these to save the pack:</p>
          <ul className="list-disc pl-5 pt-1">
            {problems.map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        {pack && (
          <button type="button" className="btn btn-primary" disabled={isSaving} onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-dark flex-1" disabled={isSaving}>
          {isSaving ? 'Saving…' : pack ? 'Save changes' : 'Save pack'}
        </button>
      </div>
    </form>
  )
}
