import HostView from '../multiple-choice/host-view'
import RevealView from '../multiple-choice/reveal-view'
import { QuizVariant } from '../types'
import PlayerView from './player-view'

const trueFalse: QuizVariant = { HostView, RevealView, PlayerView, scored: true }

export default trueFalse
