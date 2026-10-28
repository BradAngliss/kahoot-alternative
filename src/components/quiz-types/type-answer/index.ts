import { QuizVariant } from '../types'
import HostView from './host-view'
import PlayerView from './player-view'
import RevealView from './reveal-view'

const typeAnswer: QuizVariant = { HostView, RevealView, PlayerView, scored: true }

export default typeAnswer
