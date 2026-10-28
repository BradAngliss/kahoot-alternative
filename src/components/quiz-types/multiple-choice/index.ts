import { QuizVariant } from '../types'
import HostView from './host-view'
import PlayerView from './player-view'
import RevealView from './reveal-view'

const multipleChoice: QuizVariant = { HostView, RevealView, PlayerView }

export default multipleChoice
