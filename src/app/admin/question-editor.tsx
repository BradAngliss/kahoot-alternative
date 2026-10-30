import { choiceColor, choiceLetter } from '@/components/quiz-types/colors'
import { QUESTION_TYPE_LABELS, QuestionType } from '@/components/quiz-types/registry'
import { MAX_CHOICES, QuestionDraft, changeType, newChoice } from './draft'

const FIELD = 'input py-2 text-base shadow-none'
const LABEL = 'block text-sm font-semibold text-ink/70'
const SMALL_BUTTON =
  'rounded-lg border-2 border-ink/20 px-2 py-1 text-sm font-semibold text-ink/70 transition hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30'

const swapped = <T,>(items: T[], index: number, other: number) => {
  const result = [...items]
  ;[result[index], result[other]] = [result[other], result[index]]
  return result
}

function ChoicesEditor({
  question,
  onChange,
}: {
  question: QuestionDraft
  onChange: (question: QuestionDraft) => void
}) {
  const { type, choices } = question
  const isFixed = type === 'true_false'
  const isSingleCorrect = type === 'true_false'
  const hasCorrect = isSingleCorrect || type === 'multiple_choice' || type === 'multi_select'

  const setChoices = (next: QuestionDraft['choices']) => onChange({ ...question, choices: next })

  const hint = {
    multiple_choice: 'Mark the correct choice. Players pick one, and any choice you mark scores.',
    true_false: 'Mark the correct answer.',
    multi_select: 'Mark every correct choice. Players must pick exactly these to score.',
    ordering: 'List these in the correct order. Players see them shuffled.',
    poll: 'Polls have no correct answer and never score.',
  }[type as string]

  return (
    <div className="space-y-2">
      {hint && <p className="text-sm text-ink/70">{hint}</p>}
      {choices.map((choice, index) => (
        <div key={choice.key} className="flex flex-wrap items-center gap-2">
          <span
            className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg border-2 border-ink font-display font-bold ${
              type === 'ordering' ? 'bg-white' : choiceColor(index)
            }`}
          >
            {type === 'ordering' ? index + 1 : choiceLetter(index)}
          </span>
          <input
            className={`${FIELD} min-w-[10rem] flex-1`}
            value={choice.body}
            maxLength={200}
            readOnly={isFixed}
            aria-label={`Choice ${index + 1}`}
            placeholder={`Choice ${index + 1}`}
            onChange={(e) =>
              setChoices(
                choices.map((other) =>
                  other.key === choice.key ? { ...other, body: e.target.value } : other
                )
              )
            }
          />
          {hasCorrect && (
            <label className="flex items-center gap-1.5 text-sm font-semibold">
              <input
                type={isSingleCorrect ? 'radio' : 'checkbox'}
                name={`${question.key}-correct`}
                className="h-4 w-4 accent-stage"
                checked={choice.isCorrect}
                onChange={(e) =>
                  setChoices(
                    choices.map((other) =>
                      other.key === choice.key
                        ? { ...other, isCorrect: e.target.checked }
                        : isSingleCorrect
                          ? { ...other, isCorrect: false }
                          : other
                    )
                  )
                }
              />
              Correct
            </label>
          )}
          {type === 'ordering' && (
            <>
              <button
                type="button"
                className={SMALL_BUTTON}
                disabled={index === 0}
                aria-label={`Move choice ${index + 1} up`}
                onClick={() => setChoices(swapped(choices, index, index - 1))}
              >
                ↑
              </button>
              <button
                type="button"
                className={SMALL_BUTTON}
                disabled={index === choices.length - 1}
                aria-label={`Move choice ${index + 1} down`}
                onClick={() => setChoices(swapped(choices, index, index + 1))}
              >
                ↓
              </button>
            </>
          )}
          {!isFixed && (
            <button
              type="button"
              className={SMALL_BUTTON}
              disabled={choices.length <= 2}
              aria-label={`Remove choice ${index + 1}`}
              onClick={() => setChoices(choices.filter((other) => other.key !== choice.key))}
            >
              Remove
            </button>
          )}
        </div>
      ))}
      {!isFixed && (
        <button
          type="button"
          className={SMALL_BUTTON}
          disabled={choices.length >= MAX_CHOICES}
          onClick={() => setChoices([...choices, newChoice()])}
        >
          Add choice
        </button>
      )}
    </div>
  )
}

function SliderEditor({
  question,
  onChange,
}: {
  question: QuestionDraft
  onChange: (question: QuestionDraft) => void
}) {
  const fields: { key: 'min' | 'max' | 'step' | 'answer' | 'margin'; label: string; placeholder?: string }[] = [
    { key: 'min', label: 'Minimum' },
    { key: 'max', label: 'Maximum' },
    { key: 'step', label: 'Step' },
    { key: 'answer', label: 'Answer' },
    { key: 'margin', label: 'Margin (optional)', placeholder: '¼ of range' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {fields.map(({ key, label, placeholder }) => (
        <label key={key} className={LABEL}>
          {label}
          <input
            type="number"
            step="any"
            className={`${FIELD} mt-1`}
            value={question[key]}
            placeholder={placeholder}
            onChange={(e) => onChange({ ...question, [key]: e.target.value })}
          />
        </label>
      ))}
      <label className={LABEL}>
        Unit (optional)
        <input
          className={`${FIELD} mt-1`}
          value={question.unit}
          maxLength={20}
          placeholder="km"
          onChange={(e) => onChange({ ...question, unit: e.target.value })}
        />
      </label>
      <p className="col-span-full text-sm text-ink/70">
        Exact answers get full points, dropping to none at the margin away.
      </p>
    </div>
  )
}

export default function QuestionEditor({
  question,
  index,
  count,
  onChange,
  onMove,
  onRemove,
}: {
  question: QuestionDraft
  index: number
  count: number
  onChange: (question: QuestionDraft) => void
  onMove: (other: number) => void
  onRemove: () => void
}) {
  return (
    <section className="card space-y-4 p-4" aria-label={`Question ${index + 1}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-xl font-extrabold">Question {index + 1}</h3>
        <div className="flex gap-2">
          <button
            type="button"
            className={SMALL_BUTTON}
            disabled={index === 0}
            aria-label={`Move question ${index + 1} up`}
            onClick={() => onMove(index - 1)}
          >
            ↑
          </button>
          <button
            type="button"
            className={SMALL_BUTTON}
            disabled={index === count - 1}
            aria-label={`Move question ${index + 1} down`}
            onClick={() => onMove(index + 1)}
          >
            ↓
          </button>
          <button type="button" className={SMALL_BUTTON} onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <label className={LABEL}>
          Type
          <select
            className={`${FIELD} mt-1`}
            value={question.type}
            onChange={(e) => onChange(changeType(question, e.target.value as QuestionType))}
          >
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((type) => (
              <option key={type} value={type}>
                {QUESTION_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </label>
        <label className={LABEL}>
          Time limit (seconds)
          <input
            type="number"
            min={5}
            max={600}
            className={`${FIELD} mt-1`}
            value={question.timeLimit}
            onChange={(e) => onChange({ ...question, timeLimit: e.target.value })}
          />
        </label>
      </div>

      <label className={LABEL}>
        Question
        <textarea
          className={`${FIELD} mt-1`}
          rows={2}
          value={question.body}
          onChange={(e) => onChange({ ...question, body: e.target.value })}
        />
      </label>

      {question.type === 'slider' ? (
        <SliderEditor question={question} onChange={onChange} />
      ) : question.type === 'type_answer' ? (
        <label className={LABEL}>
          Accepted answers, one per line (case and extra spaces are ignored)
          <textarea
            className={`${FIELD} mt-1`}
            rows={3}
            value={question.acceptedAnswers}
            onChange={(e) => onChange({ ...question, acceptedAnswers: e.target.value })}
          />
        </label>
      ) : (
        <ChoicesEditor question={question} onChange={onChange} />
      )}
    </section>
  )
}
