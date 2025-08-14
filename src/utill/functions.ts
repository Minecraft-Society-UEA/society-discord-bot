import { getState } from 'robo.js'
import { tokens } from './types'

export function getTokens() {
	const h_tok = getState('hub_token')
	const s_tok = getState('survival_token')
	const c_tok = getState('creative_token')
	const e_tok = getState('event_token')

	const tokens = {
		hub: h_tok,
		survival: s_tok,
		creative: c_tok,
		event: e_tok
	} as tokens

	return tokens
}
