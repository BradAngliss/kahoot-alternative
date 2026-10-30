'use client'

import Wordmark from '@/components/wordmark'
import Link from 'next/link'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import PackEditor, { EditablePack } from './pack-editor'
import { adminSupabase } from './supabase'

/**
 * Only decides what to show. The database is what keeps everyone else out:
 * create_quiz_set refuses anyone not in public.admins.
 */
type Access = 'loading' | 'signed-out' | 'denied' | 'error' | 'admin'

type PackSummary = {
  id: string
  name: string
  description: string | null
  questions: { count: number }[]
  games: { count: number }[]
}

function PackRow({
  pack,
  isEditing,
  onEdit,
  onDeleted,
}: {
  pack: PackSummary
  isEditing: boolean
  onEdit: () => void
  onDeleted: () => void
}) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gameCount = pack.games[0]?.count ?? 0

  const deletePack = async () => {
    setIsDeleting(true)
    setError(null)
    const { error } = await adminSupabase.rpc('delete_quiz_set', { quiz_set_id: pack.id })
    setIsDeleting(false)
    if (error) {
      setError(error.message)
      return
    }
    onDeleted()
  }

  return (
    <li className="rounded-xl border-2 border-ink bg-white p-3">
      <p className="font-bold leading-tight">{pack.name}</p>
      <p className="text-sm text-ink/70">{pack.questions[0]?.count ?? 0} questions</p>
      {isConfirming ? (
        <div className="space-y-2 pt-2">
          <p className="text-sm font-semibold">
            Delete this pack for good?
            {gameCount > 0 &&
              ` This also deletes ${gameCount} ${
                gameCount === 1 ? 'game' : 'games'
              } played with it, including any in progress.`}
          </p>
          <div className="flex gap-2">
            <button
              className="rounded-lg border-2 border-ink bg-choice-red px-2 py-1 text-sm font-semibold text-ink disabled:opacity-50"
              disabled={isDeleting}
              onClick={deletePack}
            >
              {isDeleting ? 'Deleting…' : 'Delete'}
            </button>
            <button
              className="rounded-lg border-2 border-ink/20 px-2 py-1 text-sm font-semibold text-ink/70 hover:border-ink hover:text-ink disabled:opacity-50"
              disabled={isDeleting}
              onClick={() => {
                setIsConfirming(false)
                setError(null)
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 pt-2">
          <button
            className="rounded-lg border-2 border-ink/20 px-2 py-1 text-sm font-semibold text-ink/70 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Edit ${pack.name}`}
            disabled={isEditing}
            onClick={onEdit}
          >
            {isEditing ? 'Editing' : 'Edit'}
          </button>
          <button
            className="rounded-lg border-2 border-ink/20 px-2 py-1 text-sm font-semibold text-ink/70 hover:border-ink hover:text-ink"
            aria-label={`Delete ${pack.name}`}
            onClick={() => setIsConfirming(true)}
          >
            Delete
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="pt-2 text-sm font-semibold text-choice-red">
          {error}
        </p>
      )}
    </li>
  )
}

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSigningIn, setIsSigningIn] = useState(false)

  const signIn = async (e: FormEvent) => {
    e.preventDefault()
    setIsSigningIn(true)
    setError(null)
    const { error } = await adminSupabase.auth.signInWithPassword({ email, password })
    setIsSigningIn(false)
    if (error) setError(error.message)
  }

  return (
    <form className="card mx-auto max-w-md space-y-4 p-6" onSubmit={signIn}>
      <h1 className="font-display text-3xl font-extrabold">Admin sign in</h1>
      <label className="block text-sm font-semibold text-ink/70">
        Email
        <input
          type="email"
          autoComplete="username"
          required
          className="input mt-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="block text-sm font-semibold text-ink/70">
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          className="input mt-1"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error && (
        <p role="alert" className="font-semibold text-choice-red">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-dark w-full" disabled={isSigningIn}>
        {isSigningIn ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

function Packs() {
  const [packs, setPacks] = useState<PackSummary[]>()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)
  const [editing, setEditing] = useState<EditablePack | null>(null)
  // Changing this starts a new pack form
  const [editorCount, setEditorCount] = useState(0)
  const [isDirty, setIsDirty] = useState(false)

  const loadPacks = useCallback(async () => {
    const { data, error } = await adminSupabase
      .from('quiz_sets')
      .select('id, name, description, questions(count), games(count)')
      .order('created_at', { ascending: false })
      // Seeded packs share a created_at. Keep the list from moving between loads.
      .order('id')
    if (error) {
      setLoadError(error.message)
      return
    }
    setLoadError(null)
    setPacks(data as unknown as PackSummary[])
  }, [])

  useEffect(() => {
    loadPacks()
  }, [loadPacks])

  const canDiscard = () => !isDirty || window.confirm('Discard your unsaved changes?')

  /** Show an empty new pack form */
  const closeEditor = () => {
    setEditing(null)
    setEditorCount((count) => count + 1)
    setIsDirty(false)
  }

  const editPack = async (id: string) => {
    if (!canDiscard()) return
    const { data, error } = await adminSupabase
      .from('quiz_sets')
      .select('*, questions(*, choices(*)), games(phase, created_at)')
      .eq('id', id)
      .single()
    if (error) {
      setLoadError(error.message)
      return
    }
    setLoadError(null)
    setCreated(null)
    setIsDirty(false)
    setEditing(data as unknown as EditablePack)
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="pb-1 font-display text-4xl font-extrabold">
          {editing ? `Edit “${editing.name}”` : 'New question pack'}
        </h1>
        <p className="pb-6 text-ink/70">
          {editing
            ? 'Changes apply to new games. Use the arrows on each question to change the order.'
            : 'Saved packs show up on the host dashboard straight away.'}
        </p>
        {created && (
          <p role="status" className="mb-6 rounded-2xl border-2 border-ink bg-choice-green/30 p-4 font-semibold">
            “{created}” saved.{' '}
            <Link href="/host/dashboard" className="underline">
              See it on the dashboard
            </Link>
          </p>
        )}
        <PackEditor
          key={editing ? editing.id : `new-${editorCount}`}
          pack={editing ?? undefined}
          onDirtyChange={setIsDirty}
          onCancel={() => {
            if (canDiscard()) closeEditor()
          }}
          onSaved={(name) => {
            closeEditor()
            setCreated(name)
            window.scrollTo({ top: 0 })
            loadPacks()
          }}
        />
      </div>
      <aside>
        <h2 className="pb-3 font-display text-2xl font-extrabold">Existing packs</h2>
        {loadError && (
          <p role="alert" className="font-semibold text-choice-red">
            Couldn&apos;t load packs: {loadError}
          </p>
        )}
        <ul className="space-y-2">
          {packs?.map((pack) => (
            <PackRow
              key={pack.id}
              pack={pack}
              isEditing={editing?.id === pack.id}
              onEdit={() => editPack(pack.id)}
              onDeleted={() => {
                // The saved message may link to the pack that was just deleted
                setCreated(null)
                if (editing?.id === pack.id) closeEditor()
                loadPacks()
              }}
            />
          ))}
        </ul>
      </aside>
    </div>
  )
}

export default function AdminPage() {
  // undefined until the stored session has been read
  const [userId, setUserId] = useState<string | null>()
  const [access, setAccess] = useState<Access>('loading')

  useEffect(() => {
    const {
      data: { subscription },
    } = adminSupabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (userId === undefined) return
    if (userId === null) {
      setAccess('signed-out')
      return
    }

    let isCurrent = true
    setAccess('loading')
    adminSupabase.rpc('is_admin').then(({ data, error }) => {
      if (!isCurrent) return
      setAccess(error ? 'error' : data ? 'admin' : 'denied')
    })
    return () => {
      isCurrent = false
    }
  }, [userId])

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <span className="flex items-center gap-3">
            <Wordmark tone="dark" />
            <span className="rounded-full bg-ink px-3 py-0.5 text-sm font-bold text-white">Admin</span>
          </span>
          {userId && (
            <button
              className="rounded-full border-2 border-transparent px-4 py-1.5 font-semibold text-ink/70 transition hover:border-ink/20 hover:text-ink"
              onClick={() => adminSupabase.auth.signOut()}
            >
              Sign out
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        {access === 'loading' && <p className="text-ink/70">Checking access…</p>}
        {access === 'signed-out' && <SignIn />}
        {access === 'denied' && (
          <div className="card mx-auto max-w-md p-6">
            <h1 className="font-display text-3xl font-extrabold">No access</h1>
            <p className="pt-2 text-ink/70">This account isn&apos;t an admin.</p>
          </div>
        )}
        {access === 'error' && (
          <div role="alert" className="card mx-auto max-w-md p-6">
            <h1 className="font-display text-3xl font-extrabold">Something went wrong</h1>
            <p className="pt-2 text-ink/70">
              Couldn&apos;t check your access. Reload the page to try again.
            </p>
          </div>
        )}
        {access === 'admin' && <Packs />}
      </main>
    </div>
  )
}
