import { FormEvent, useEffect, useState } from 'react'
import { QuestionDraft, newQuestion, packProblems, toPayload } from './draft'
import QuestionEditor from './question-editor'
import { adminSupabase } from './supabase'

export default function PackEditor({ onCreated }: { onCreated: (name: string) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => [newQuestion()])
  const [problems, setProblems] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // A pack can be a lot of typing, so warn before leaving with it unsaved
  const hasWork = name !== '' || description !== '' || questions.some((question) => question.body !== '')
  useEffect(() => {
    if (!hasWork) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasWork])

  const save = async (e: FormEvent) => {
    e.preventDefault()

    const found = packProblems(name, questions)
    setProblems(found)
    if (found.length > 0) return

    setIsSaving(true)
    const { error } = await adminSupabase.rpc('create_quiz_set', {
      name: name.trim(),
      description: description.trim(),
      questions: toPayload(questions),
    })
    setIsSaving(false)

    if (error) {
      setProblems([error.message])
      return
    }

    onCreated(name.trim())
    setName('')
    setDescription('')
    setQuestions([newQuestion()])
  }

  return (
    <form className="space-y-6" onSubmit={save} noValidate>
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

      <button type="submit" className="btn btn-dark w-full" disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save pack'}
      </button>
    </form>
  )
}
