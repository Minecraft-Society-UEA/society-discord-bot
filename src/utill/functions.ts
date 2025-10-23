import { client, Flashcore, getState, logger, setState } from 'robo.js'
import {
	all_player_list,
	check_member_return,
	connected_players,
	db_player,
	db_server,
	db_warns,
	player,
	return_command,
	token
} from './types'
import {
	createBan,
	getAllServers,
	getProfileByDId,
	getServerByID,
	getWarningsEffectBansByUserId,
	updateServerPlayers
} from './database_functions'
import { TextChannel, VoiceBasedChannel } from 'discord.js'
import { EmbedBuilder } from '@discordjs/builders'

// resolve the token for a server
export function server_token_resolver(id: string): string | null {
	return getState<string>(`${id}_token`)
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
	const servers = (await getAllServers()) as db_server[]
	for (const server of servers) {
		try {
			const body = { username: server.user, password: server.pass }
			const res = await fetch(`${server.host}:${server.port}/api/auth/login`, {
				method: 'POST',
				body: JSON.stringify(body)
			})

			if (!res.ok) {
				logger.error(`Error logging in to ${server.name}.`)
				continue
			}

			const data = (await res.json()) as token
			await setState(`${server.id}_token`, data.token)
		} catch (err) {
			logger.error(`Error loading token for ${server}:`, err)
		}
	}

	logger.info(`Logged in to all servers and stored tokens`)
}

// a function to get all online players across all servers
export async function getPlayerListAllServers(): Promise<all_player_list | undefined> {
	const servers = (await getAllServers()) as db_server[]
	let total_online = 0
	let all_players: player[] = []
	let server_players: { id: string; players: player[] }[] = []
	for (const server of servers) {
		try {
			const res = await fetch(`${server.host}:${server.port}/api/players`, {
				headers: { Authorization: `Bearer ${server_token_resolver(server.id)}` }
			})

			if (!res.ok) {
				logger.error(`Error getting ${server} players.`)
				return
			}

			const data = (await res.json()) as connected_players

			server.currently_online = data.online_players.length
			server.players = data.online_players

			await updateServerPlayers(server.id, data.online_players, data.online_players.length)

			total_online = total_online + data.online_players.length
			all_players = all_players.concat(data.online_players)
			server_players.push({ id: server.id, players: data.online_players })
		} catch (err) {
			logger.error(`Failed to fetch ${server} players: ${err}`)
			return
		}
	}

	return {
		server_players,
		total_online,
		all_players
	}
}

// a function to get all online players across all servers
export async function getPlayerList(serverid: string): Promise<connected_players | undefined> {
	const server = (await getServerByID(serverid)) as db_server

	try {
		const res = await fetch(`${server.host}:${server.port}/api/players`, {
			headers: { Authorization: `Bearer ${server_token_resolver(server.id)}` }
		})

		if (!res.ok) {
			logger.error(`Error getting ${server} players.`)
			return
		}

		const data = (await res.json()) as connected_players
		return data
	} catch (err) {
		logger.error(`Failed to fetch ${server} players: ${err}`)
		return
	}
}

// check if player is online and returns what server there in
export async function online_server_check(mc_name: string) {
	const lists = (await getPlayerListAllServers()) as all_player_list

	const servers = (await getAllServers()) as db_server[]

	for (const server of servers) {
		let found
		const players = server.players
		for (const player of players) {
			if (player.name === mc_name) return server.id
		}
	}

	return false
}

export async function mc_command(id: string, command: string) {
	const details = (await getServerByID(id)) as db_server
	const body_command = {
		command: command
	}

	const res = await fetch(`${details.host}:${details.port}/api/server/command`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_token_resolver(details.id)}`
		},
		body: JSON.stringify(body_command)
	})
	if (!res.ok) {
		throw new Error(`mc_command failed with status ${res.status}: ${await res.text()}`)
	}

	const text = await res.text()
	if (!text) return null

	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

export async function message_player(mc_username: string, msg: string) {
	const online = await online_server_check(mc_username)
	if (!online) return false
	const server = (await getServerByID(online)) as db_server
	const body_message = {
		player: mc_username,
		message: msg
	}

	if (!server) return false

	const response = await fetch(`${server.host}:${server.port}/api/player/message`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_token_resolver(server.id)}`
		},
		body: JSON.stringify(body_message)
	})

	return true
}

export async function mc_ban_player(mc_username: string, msg: string, mins: string) {
	const online = await online_server_check(mc_username)
	if (!online) return false
	const server = (await getServerByID(online)) as db_server
	const body_command = {
		command: `ban ${mc_username} ${mins} ${msg}`
	}

	const response = await fetch(`${server.host}:${server.port}/api/server/command`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_token_resolver(server.id)}`
		},
		body: JSON.stringify(body_command)
	})

	return (await response.json()) as return_command
}

export async function BAN(user_id: string, mc_username: string, reason: string, duationM: string) {
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
		await createBan(user_id, reason, mins_till_unban)
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

export async function updatePlayersChannel() {
	console.log(`updating players channel`)
	const guildid = process.env.GUILD_ID
	const channelid = process.env.SERVER_LIST_CHANNEL_ID
	const channelid2 = process.env.ONLINE_CHANNEL_ID
	const messageid = (await Flashcore.get<string>(`players_msg_id`)) ?? undefined

	await getPlayerListAllServers()

	const embed = new EmbedBuilder()
	const servers = (await getAllServers()) as db_server[]
	let tot_online: number = 0
	embed.setTitle('✦ Online players across all servers:').setTimestamp().setColor([136, 61, 255])

	for (const server of servers) {
		if (!server.players) {
			server.players = []
		} else if (typeof server.players === 'string') {
			try {
				server.players = await JSON.parse(server.players)
			} catch {
				server.players = []
			}
		}

		tot_online += server.players.length

		embed.addFields({
			name: `${server.emoji} ${server.name}: ${server.players.length} Players`,
			value: server.players.length > 0 ? server.players.map((p) => p.name).join(', ') : ''
		})
	}

	embed.setDescription(`Online: ${tot_online}/300`)

	if (!guildid || !channelid || !channelid2) return console.error(`env not loaded correctly?...`)

	const guild = await client.guilds.cache.get(guildid)
	if (!guild) return console.error(`guild not gotten from client...`)
	const channelmsg = (await guild.channels.cache.get(channelid)) as TextChannel
	if (!channelmsg?.isSendable() || !channelmsg.isTextBased()) return console.log(`channel invalid`)
	const channel = (await guild.channels.cache.get(channelid2)) as VoiceBasedChannel
	if (!channel.isVoiceBased()) return console.log(`channel invalid`)

	await channel.setName(`👥 Online: ${tot_online}/300`)

	if (messageid) {
		try {
			const msg = await channelmsg.messages.fetch(messageid)
			await msg.edit({ embeds: [embed] })
		} catch (err) {
			console.warn(`Failed to edit existing message, sending new one instead:`, err)
			const msg = await channelmsg.send({ embeds: [embed] })
			await Flashcore.set<string>('players_msg_id', msg.id)
		}
	} else {
		const msg = await channelmsg.send({ embeds: [embed] })
		await Flashcore.set<string>('players_msg_id', msg.id)
	}
	return
}
