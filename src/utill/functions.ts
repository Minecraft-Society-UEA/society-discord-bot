import { getState, logger, setState } from 'robo.js'
import { all_player_list, check_member_return, connected_players, db_player, player, token, tokens } from './types'
import { getProfileByDId } from './database_functions'

// a function to easily get all tokens for every server and return them as a object
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

// a function to generate a 5 digit long code for verification
export function generateCode(length = 5) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
	let code = ''
	for (let i = 0; i < length; i++) {
		code += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return code
}

//check if member function
export async function checkMember(userid: string) {
	const profile = (await getProfileByDId(userid)) as db_player
	if (!profile.uea_email) return
	const ueaname = profile.uea_email.split(`@`)[0]
	const return_obj = {} as check_member_return

	return_obj.message = ``
	return_obj.colour = `Red`
	return return_obj
}

//function to get and save all tokens for each server
export async function loadTokens() {
	const user = process.env.MC_USER
	const pass = process.env.MC_PASS
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const s_port = process.env.SURVIVAL_PORT
	const c_port = process.env.CREATIVE_PORT
	const e_port = process.env.EVENT_PORT

	// user and pass body for login
	const body = {
		username: user,
		password: pass
	}

	// login and saving of the hub token
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

	// login and saving of the survival token
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

	// login and saving of the creative token
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

	// login and saving of the event token
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

// a function to get all online players across all servers
export async function getPlayerListAllServers() {
	const host = process.env.MC_HOST
	const h_port = process.env.HUB_PORT
	const s_port = process.env.SURVIVAL_PORT
	const c_port = process.env.CREATIVE_PORT
	const e_port = process.env.EVENT_PORT
	const tokens = getTokens() as tokens

	let data_hub
	let data_survival
	let data_creative
	let data_event

	// fetch player list for each server
	const response_hub = await fetch(`${host}:${h_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.hub}`
		}
	})
	if (!response_hub.ok) {
		logger.error('Error getting hub players.')
	} else {
		data_hub = (await response_hub.json()) as connected_players
	}

	const response_survival = await fetch(`${host}:${s_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.survival}`
		}
	})
	if (!response_survival.ok) {
		logger.error('Error getting survival players.')
	} else {
		data_survival = (await response_survival.json()) as connected_players
	}

	const response_creative = await fetch(`${host}:${c_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.creative}`
		}
	})
	if (!response_creative.ok) {
		logger.error('Error getting creative players.')
	} else {
		data_creative = (await response_creative.json()) as connected_players
	}

	const response_event = await fetch(`${host}:${e_port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${tokens.event}`
		}
	})
	if (!response_event.ok) {
		logger.error('Error getting event players.')
	} else {
		data_event = (await response_event.json()) as connected_players
	}

	if (!data_hub || !data_survival || !data_creative || !data_event) {
		return
	}

	// work out the total players online
	const total_online =
		data_hub?.online_players.length +
		data_survival?.online_players.length +
		data_creative.online_players.length +
		data_event.online_players.length

	const all_players_arr = [] as player[]
	all_players_arr.concat(data_hub.online_players)
	all_players_arr.concat(data_survival.online_players)
	all_players_arr.concat(data_creative.online_players)
	all_players_arr.concat(data_event.online_players)

	const all_lists = {
		hub: data_hub,
		survival: data_survival,
		creative: data_creative,
		event: data_event,
		total_online: total_online,
		all_players: all_players_arr
	} as all_player_list

	return all_lists
}
