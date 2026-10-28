import MultipleChoiceHostView from '../multiple-choice/host-view'
import PlayerView from '../multiple-choice/player-view'
import RevealView from '../multiple-choice/reveal-view'
import { HostViewProps, QuizVariant } from '../types'

// A poll has no right answer, so the choices are never marked
function HostView(props: HostViewProps) {
  return <MultipleChoiceHostView {...props} markCorrect={false} />
}

const poll: QuizVariant = { HostView, RevealView, PlayerView, scored: false }

export default poll
