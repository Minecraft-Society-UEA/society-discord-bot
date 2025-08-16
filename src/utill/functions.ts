import { getState, logger, setState } from 'robo.js'
import { token, tokens } from './types'

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

export function generateCode(length = 5) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let code = ''
	for (let i = 0; i < length; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return code
}

export async function loadTokens() {
	const user = process.env.MC_USER
	const pass = process.env.MC_PASS
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const s_port = process.env.SURVIVAL_PORT
	const c_port = process.env.CREATIVE_PORT
	const e_port = process.env.EVENT_PORT

	const body = {
		username: user,
		password: pass
	}

	try {
		const response = await fetch(`${host}:${h_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to hub.')
		} else {
			const data = (await response.json()) as token
			await setState('hub_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for hub:', err)
	}

	try {
		const response = await fetch(`${host}:${s_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to survival.')
		} else {
			const data = (await response.json()) as token
			await setState('survival_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for survival:', err)
	}

	try {
		const response = await fetch(`${host}:${c_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to creative.')
		} else {
			const data = (await response.json()) as token
			await setState('creative_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for creative:', err)
	}

	try {
		const response = await fetch(`${host}:${e_port}/api/auth/login`, {
			method: 'POST',
			body: JSON.stringify(body)
		})
		if (!response.ok) {
			logger.error('Error Logging in to event.')
		} else {
			const data = (await response.json()) as token
			await setState('event_token', data.token)
		}
	} catch (err) {
		logger.error('Error loading Token for event:', err)
	}
	logger.info(`logged in to all servers and stored tokens`)
}
