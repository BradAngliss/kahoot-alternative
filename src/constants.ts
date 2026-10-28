/** Time until the choices for the question are revealed in ms. Also set in set_question_started_at in the database. */
export const TIME_TIL_CHOICE_REVEAL = 5000
/** How long the host shows the answer before moving to the next question, in ms */
export const TIME_TIL_NEXT_QUESTION = 5000
/**
 * How long before time runs out to send an answer the player hasn't submitted, in ms.
 * Leaves time for it to reach the database before the host closes answering.
 */
export const AUTO_SUBMIT_EARLY = 1500
