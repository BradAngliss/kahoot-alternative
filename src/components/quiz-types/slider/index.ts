import { QuizVariant } from '../types'
import HostView from './host-view'
import PlayerView from './player-view'
import RevealView from './reveal-view'

const slider: QuizVariant = { HostView, RevealView, PlayerView, scored: true }

export default slider
