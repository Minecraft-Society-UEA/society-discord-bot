import { client, Flashcore, getState, logger, setState } from 'robo.js'
import {
	check_member_return,
	connected_players,
	db_member,
	db_online_player,
	db_player,
	db_server,
	db_warns,
	player,
	return_command,
	role_storage,
	token
} from './types'
import {
	createBan,
	getAllMembers,
	getAllPlayers,
	getAllServers,
	getPlayersByName,
	getPlayersByServer,
	getProfileByDId,
	getProfileByUeaEmail,
	getServerByID,
	getWarningsEffectBansByUserId,
	updateMember,
	updatePlayerProfile,
	updateServerPlayers
} from './database_functions'
import { TextChannel, VoiceBasedChannel } from 'discord.js'
import { EmbedBuilder, RGBTuple } from '@discordjs/builders'
import * as cheerio from 'cheerio'
import puppeteer, { Browser, Page, Protocol } from 'puppeteer'

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
export async function getPlayerListAllServers() {}

// a function to get all online players across all servers
export async function getPlayerList(serverid: string): Promise<connected_players | undefined> {
	const server = (await getServerByID(serverid)) as db_server
	const connected_players = {} as connected_players
	const players = (await getPlayersByServer(serverid)) as player[]

	connected_players.max_players = 300
	connected_players.online_players = players

	return connected_players
}

// check if player is online and returns what server there in
export async function online_server_check(mc_name: string) {
	const player = (await getPlayersByName(mc_name)) as db_online_player
	if (!player) return false
	return player ? player.server : false
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
	const guildId = process.env.DISCORD_GUILD_ID
	const textChannelId = process.env.SERVER_LIST_CHANNEL_ID
	const voiceChannelId = process.env.ONLINE_CHANNEL_ID
	const messageId = (await Flashcore.get<string>(`players_msg_id`)) ?? undefined

	if (!guildId || !textChannelId || !voiceChannelId) return console.error(`Missing env vars`)

	const guild = client.guilds.cache.get(guildId)
	if (!guild) return console.error(`Guild not found`)

	const textChannel = guild.channels.cache.get(textChannelId) as TextChannel
	const voiceChannel = guild.channels.cache.get(voiceChannelId) as VoiceBasedChannel
	if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel`)
	if (!voiceChannel?.isVoiceBased()) return console.error(`Invalid voice channel`)

	const servers = (await getAllServers()) as db_server[]
	const players = (await getAllPlayers()) as db_online_player[]
	let totalOnline = 0

	const embed = new EmbedBuilder()
		.setTitle('✦ Online players across all servers:')
		.setTimestamp()
		.setColor([136, 61, 255])

	for (const server of servers) {
		const serverPlayers = players.filter((p) => p.server === server.id)
		totalOnline += serverPlayers.length

		embed.addFields({
			name: `${server.emoji} ${server.name}: ${serverPlayers.length} Players`,
			value: serverPlayers.length > 0 ? serverPlayers.map((p) => p.name).join(', ') : '\u200b'
		})
	}

	embed.setDescription(`Online: ${totalOnline}/300`)

	try {
		const newName = `👥 Online: ${totalOnline}/300`
		if (voiceChannel.name !== newName) {
			voiceChannel.setName(newName)
		}
	} catch (err) {
		logger.warn(`Failed to rename channel "${voiceChannelId}": ${err}`)
	}

	try {
		const newEmbedJSON = JSON.stringify(embed.toJSON())
		const lastEmbedJSON = await Flashcore.get<string>('players_embed_cache')

		if (newEmbedJSON !== lastEmbedJSON) {
			if (messageId) {
				try {
					const msg = await textChannel.messages.fetch(messageId)
					await msg.edit({ embeds: [embed] })
				} catch {
					const msg = await textChannel.send({ embeds: [embed] })
					await Flashcore.set('players_msg_id', msg.id)
				}
			} else {
				const msg = await textChannel.send({ embeds: [embed] })
				await Flashcore.set('players_msg_id', msg.id)
			}
			await Flashcore.set('players_embed_cache', newEmbedJSON)
		}
	} catch (err) {
		logger.error(`Failed to update player embed message: ${err}`)
	}
}

export async function refreshOnlinePlayers() {
	const servers = (await getAllServers()) as db_server[]
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

			await updateServerPlayers(server.id, data.online_players)
		} catch (err) {
			logger.error(`Failed to fetch ${server.name} players: ${err}`)
			return
		}
	}
}

function logingDebug(msg: string, clour: RGBTuple) {
	const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
	const embed = new EmbedBuilder()
	if (!guild) return console.error(`Guild not found`)

	const textChannel = guild.channels.cache.get(process.env.DISCORD_DEBUG_CHANNEL_ID) as TextChannel
	if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel in loging`)

	embed.setColor(clour).setTitle(msg)

	textChannel.send({ embeds: [embed] })
}

function loging(msg: string, clour: RGBTuple) {
	const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
	const embed = new EmbedBuilder()
	if (!guild) return console.error(`Guild not found`)

	const textChannel = guild.channels.cache.get(process.env.DISCORD_LOGGING_CHANNEL_ID) as TextChannel
	if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel in loging`)

	embed.setColor(clour).setTitle(msg)

	textChannel.send({ embeds: [embed] })
}

function logingRaw(msg: string) {
	const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
	if (!guild) return console.error(`Guild not found`)

	const textChannel = guild.channels.cache.get(process.env.DISCORD_LOGGING_CHANNEL_ID) as TextChannel
	if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel in loging`)

	textChannel.send({ content: msg })
}

export const log = {
	error: (message: string) => {
		console.error(message)
		logingDebug(message, [255, 0, 0])
	},
	info: (message: string) => {
		console.info(message)
		loging(message, [0, 0, 255])
	},
	msg: async (message: string) => {
		console.log(message)
		loging(message, [128, 128, 128])
	},
	msgraw: async (message: string) => {
		console.log(message)
		logingRaw(message)
	},
	success: async (message: string) => {
		console.log(message)
		logingDebug(message, [0, 255, 0])
	}
}

export function extractIds(html: string): string[] {
	const $ = cheerio.load(html)
	const results: string[] = []

	$('tr').each((_, el) => {
		const tds = $(el).find('td')
		if (tds.length >= 2) {
			const text = $(tds[1]).text().trim()
			if (text) results.push(text)
		}
	})

	return results
}

export async function validateMembers() {
	const members = (await getAllMembers()) as db_member[]
	for (const member of members) {
		const profile = (await getProfileByUeaEmail(member.id)) as db_player
		if (profile) {
			await updateMember(member.id, profile.user_id)

			const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
			if (!guild || !guild.members.me) {
				log.error(`invalid guild in validate members`)
				continue
			}

			await mc_command(`a406fbb6-418d-4160-8611-1c180d33da14`, `lp user ${profile.mc_uuid} promote player`)

			profile.mc_rank = `member`

			await updatePlayerProfile(profile.user_id, profile)

			log.info(`profile: ${profile.mc_username} has been made a member`)
		}
	}
}

type PuppeteerCookies = Protocol.Network.CookieParam[]

async function saveCookies(browser: Browser): Promise<void> {
	const pages = await browser.pages()
	const cookies = (await pages[0].cookies()) as PuppeteerCookies
	await Flashcore.set('cookies', cookies)
}

async function loadCookies(page: Page): Promise<void> {
	const stored = await Flashcore.get('cookies')
	if (stored) {
		const cookies = stored as any
		for (const c of cookies) await page.setCookie(c)
	}
}
export async function fetchTableHtml(): Promise<string> {
	const { SU_LOGIN_PAGE, SU_MEMBER_PAGE, SU_USER, SU_PASS } = process.env
	if (!SU_LOGIN_PAGE || !SU_MEMBER_PAGE || !SU_USER || !SU_PASS) throw new Error('Missing environment variables')

	const browser = await puppeteer.launch({ headless: true })
	const page = await browser.newPage()

	await page.goto(SU_MEMBER_PAGE, { waitUntil: 'networkidle2' })

	if (page.url().includes('login')) {
		log.info('[html graber] Logging in...')
		await page.type('#ctl00_logincontrol_UserName', SU_USER)
		await page.type('#ctl00_logincontrol_Password', SU_PASS)
		await page.click('#ctl00_logincontrol_btnLogin')
		await page.waitForNavigation({ waitUntil: 'networkidle2' })
	}

	await page.goto(SU_MEMBER_PAGE, { waitUntil: 'networkidle2' })
	await page.waitForSelector('table.msl_table')

	const tableHtml = await page.$eval('table.msl_table', (el) => el.outerHTML)
	log.info(`[html graber] grabbed HTML`)
	await browser.close()
	return tableHtml
}
