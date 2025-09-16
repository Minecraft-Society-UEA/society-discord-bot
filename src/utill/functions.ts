import { getState, logger, setState } from 'robo.js'
import {
	all_player_list,
	check_member_return,
	connected_players,
	db_player,
	db_warns,
	player,
	return_command,
	server_details,
	ServerKey,
	token,
	tokens
} from './types'
import { createBan, getProfileByDId, getWarningsEffectBansByUserId } from './database_functions'
import { create } from 'domain'

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
	const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789'
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
	if (!user || !pass || !host) {
		logger.error('MC_USER, MC_PASS, or MC_HOST not set in env')
		return
	}

	const body = { username: user, password: pass }
	const servers: ServerKey[] = ['hub', 'survival', 'creative', 'event']

	for (const server of servers) {
		const details = (await server_port_token_resolver(server)) as server_details

		try {
			const res = await fetch(`${host}:${details.port}/api/auth/login`, {
				method: 'POST',
				body: JSON.stringify(body)
			})

			if (!res.ok) {
				logger.error(`Error logging in to ${server}.`)
				continue
			}

			const data = (await res.json()) as token
			await setState(`${server}_token`, data.token)
		} catch (err) {
			logger.error(`Error loading token for ${server}:`, err)
		}
	}

	logger.info(`Logged in to all servers and stored tokens`)
}

// a function to get all online players across all servers
export async function getPlayerListAllServers(): Promise<all_player_list | undefined> {
	const host = process.env.MC_HOST
	const servers: ServerKey[] = ['hub', 'survival', 'creative', 'event']
	const results: Record<ServerKey, connected_players> = {} as Record<ServerKey, connected_players>
	let total_online = 0
	let all_players: player[] = []

	for (const server of servers) {
		const details = (await server_port_token_resolver(server)) as server_details

		try {
			const res = await fetch(`${host}:${details.port}/api/players`, {
				headers: { Authorization: `Bearer ${details.token}` }
			})

			if (!res.ok) {
				logger.error(`Error getting ${server} players.`)
				return
			}

			const data = (await res.json()) as connected_players
			results[server] = data
			total_online += data.online_players.length
			all_players = all_players.concat(data.online_players)
		} catch (err) {
			logger.error(`Failed to fetch ${server} players: ${err}`)
			return
		}
	}

	return {
		...results,
		total_online,
		all_players
	}
}

export async function online_server_check(mc_name: string) {
	const lists = (await getPlayerListAllServers()) as all_player_list

	const servers: ServerKey[] = ['hub', 'survival', 'creative', 'event']

	for (const server of servers) {
		const found = lists[server].online_players.find((p: player) => p.name.toLowerCase() === mc_name.toLowerCase())
		if (found) return server
	}

	return false
}

export async function server_port_token_resolver(server: ServerKey): Promise<server_details> {
	const tokens = getTokens() as tokens

	const config: Record<ServerKey, server_details> = {
		hub: {
			port: process.env.HUB_PORT ?? '00',
			token: tokens.hub
		},
		survival: {
			port: process.env.SURVIVAL_PORT ?? '00',
			token: tokens.survival
		},
		creative: {
			port: process.env.CREATIVE_PORT ?? '00',
			token: tokens.creative
		},
		event: {
			port: process.env.EVENT_PORT ?? '00',
			token: tokens.event
		}
	}

	return config[server]
}

export async function mc_command(server: ServerKey, command: string) {
	const host = process.env.MC_HOST
	const details = (await server_port_token_resolver(server)) as server_details
	const body_command = {
		command: command
	}

	const response = await fetch(`${host}:${details.port}/api/server/command`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${details.token}`
		},
		body: JSON.stringify(body_command)
	})

	return (await response.json()) as return_command
}

export async function message_player(mc_username: string, msg: string) {
	const host = process.env.MC_HOST
	const server = await online_server_check(mc_username)
	const body_message = {
		player: mc_username,
		message: msg
	}

	if (!server) return

	const details = await server_port_token_resolver(server)

	const response = await fetch(`${host}:${details.port}/api/player/message`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${details.token}`
		},
		body: JSON.stringify(body_message)
	})

	return true
}

export async function mc_ban_player(mc_username: string, msg: string, mins: string) {
	const host = process.env.MC_HOST
	const details = (await server_port_token_resolver(`hub`)) as server_details
	const body_command = {
		command: `ban ${mc_username} ${mins} ${msg}`
	}

	const response = await fetch(`${host}:${details.port}/api/server/command`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${details.token}`
		},
		body: JSON.stringify(body_command)
	})

	return (await response.json()) as return_command
}

export async function BAN(user_id: string, mc_username: string, reason: string, banned_till: string) {
	const warnings = (await getWarningsEffectBansByUserId(user_id)) as db_warns[]

	const createdAt = new Date(warnings[warnings.length - 1].created_at)
	const expiryDate = new Date(createdAt)
	expiryDate.setFullYear(expiryDate.getFullYear() + 1)
	const diffMs = expiryDate.getTime() - Date.now()
	const mins_till_unban = Math.max(0, Math.floor(diffMs / (1000 * 60)))
	if (!warnings) {
		console.log(`cant ban user with no Warnings`)
		return false
	} else {
		await createBan(user_id, reason, banned_till)
		const server = (await mc_ban_player(mc_username, reason, `${mins_till_unban}m`)) as return_command

		if (server.success) return true
	}
}

export function dateAfterMinutes(minutes: number): string {
	const target = new Date(Date.now() + minutes * 60000)

	const day = String(target.getDate()).padStart(2, '0')
	const month = String(target.getMonth() + 1).padStart(2, '0')
	const year = target.getFullYear()

	return `${day}/${month}/${year}`
}

export async function getServerPlayer(server: ServerKey, mc_user: string) {
	const host = process.env.MC_HOST
	const details = await server_port_token_resolver(server)
	const response_hub = await fetch(`${host}:${details.port}/api/players`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${details.token}`
		}
	})

	if (!response_hub.ok) {
		logger.error('Error getting hub players.')
		return false
	}

	const data_hub = (await response_hub.json()) as connected_players

	if (!data_hub) {
		console.error(`hub server is down`)
		return false
	}

	const player = data_hub.online_players.find((p) => p.name === mc_user) as player

	return player
}
