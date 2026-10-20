import { TextChannel, EmbedBuilder, ActivityType, DiscordAPIError, RESTJSONErrorCodes } from 'discord.js'
import { Flashcore, client } from 'robo.js'
import {
	getAllServers,
	getAllPlayers,
	server_auth_header,
	updateServerPlayers,
	log,
	db_online_player,
	db_server,
	connected_players,
	fabric_player,
	fabric_players,
	player,
	addPlaytime,
	getProfileByMcUuid
} from '~/utill'

const PLAYERS_EMBED_TITLE = '✦ Online Players'

// player grid: 3 columns of up to 14 chars with 3-space gaps = 48 chars per line,
// the most that fits in a code block inside an embed without wrapping
const GRID_COLUMNS = 3
const GRID_COLUMN_MAX = 14
const GRID_GAP = '   '
// discord caps embed field values at 1024 chars, so big lists are split across fields
const FIELD_VALUE_MAX = 1000
// invisible line (braille blanks joined by normal spaces, so it wraps instead of overflowing) that stretches
// every embed to near full width, giving the grid room for 48 chars and keeping the width the same each update
const EMBED_WIDTH_FILLER = Array(36).fill('\u2800').join(' ')

// the player list message is updated every 10s (without awaiting) and reset every 2h, so runs can overlap;
// queue them so two runs can't both see no message and each post a new one
let players_msg_queue: Promise<unknown> = Promise.resolve()
function queuePlayersMsg<T>(fn: () => Promise<T>): Promise<T> {
	const run = players_msg_queue.then(fn, fn)
	players_msg_queue = run.catch(() => {})
	return run
}

function getPlayersChannel() {
	const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
	if (!guild) return console.error(`Guild not found`)

	const textChannel = guild.channels.cache.get(process.env.SERVER_LIST_CHANNEL_ID) as TextChannel
	if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel`)

	return textChannel
}

// deletes every player list message the bot has posted in the channel, including any leftover duplicates
async function deletePlayersMessages(textChannel: TextChannel) {
	const recent = await textChannel.messages.fetch({ limit: 50 })
	const old_lists = recent.filter(
		(m) =>
			m.author.id === client.user?.id &&
			(m.embeds[0]?.title === PLAYERS_EMBED_TITLE)
	)
	for (const msg of old_lists.values()) {
		await msg.delete().catch((err) => log.error(`Failed to delete old player list message: ${err}`))
	}
}

// removes the player list message so the next update posts a fresh one at the bottom of the channel
export function resetPlayersMessage() {
	return queuePlayersMsg(async () => {
		const textChannel = getPlayersChannel()
		if (!textChannel) return

		await Flashcore.delete(`players_msg_id`)
		await Flashcore.delete(`players_embed_cache`)
		await deletePlayersMessages(textChannel)
	})
}

// shortens names longer than the column with an ellipsis so the grid never wraps
function fitName(name: string, width: number) {
	return name.length <= width ? name : name.slice(0, width - 1) + '…'
}

// lays names out left to right in a fixed-width grid, returned as one or more code block bodies
// that each fit in a single embed field
function playerGridBlocks(names: string[], width: number): string[] {
	const rows: string[] = []
	for (let i = 0; i < names.length; i += GRID_COLUMNS) {
		const row = names.slice(i, i + GRID_COLUMNS).map((name) => fitName(name, width).padEnd(width))
		rows.push(row.join(GRID_GAP).trimEnd())
	}

	const rows_per_block = Math.floor(FIELD_VALUE_MAX / (GRID_COLUMNS * (width + GRID_GAP.length)))
	const blocks: string[] = []
	for (let i = 0; i < rows.length; i += rows_per_block) {
		blocks.push(rows.slice(i, i + rows_per_block).join('\n'))
	}
	return blocks
}

// builds the player list embed: busiest servers first, unreachable servers last as offline
function buildPlayersEmbed(servers: db_server[], players: db_online_player[]) {
	const reachable = servers.filter((s) => !unreachable_servers.has(s.id))
	const offline = servers.filter((s) => unreachable_servers.has(s.id))

	const server_lists = reachable
		.map((server) => ({ server, names: players.filter((p) => p.server === server.id).map((p) => p.name) }))
		.sort((a, b) => b.names.length - a.names.length)
	const total_online = server_lists.reduce((sum, s) => sum + s.names.length, 0)

	// one column width for the whole embed so the grids line up across servers
	const width = Math.min(Math.max(0, ...server_lists.flatMap((s) => s.names.map((n) => n.length))), GRID_COLUMN_MAX)

	// red only when every server is unreachable, otherwise green (even with 0 players)
	const summary =
		servers.length > 0 && reachable.length === 0
			? '🔴 All servers are offline'
			: `🟢 **${total_online}** players online right now`

	const embed = new EmbedBuilder()
		.setTitle(PLAYERS_EMBED_TITLE)
		.setDescription(`${summary}\n${EMBED_WIDTH_FILLER}`)
		.setColor([136, 61, 255])
		.setFooter({ text: 'Last updated' })
		.setTimestamp()

	for (const { server, names } of server_lists) {
		const heading = `${server.name} — ${names.length} online`
		if (names.length === 0) {
			embed.addFields({ name: heading, value: '*Nobody online*' })
			continue
		}
		playerGridBlocks(names, width).forEach((block, i) =>
			embed.addFields({ name: i === 0 ? heading : '\u200b', value: `\`\`\`\n${block}\n\`\`\`` })
		)
	}

	for (const server of offline) {
		embed.addFields({ name: `${server.name} — Offline`, value: '*Server offline*' })
	}

	return { embed, total_online }
}

export function updatePlayersChannel() {
	return queuePlayersMsg(updatePlayersMessage)
}

async function updatePlayersMessage() {
	console.log(`updating players channel`)
	const guildId = process.env.DISCORD_GUILD_ID
	const textChannelId = process.env.SERVER_LIST_CHANNEL_ID
	const messageId = (await Flashcore.get<string>(`players_msg_id`)) ?? undefined

	if (!guildId || !textChannelId) return console.error(`Missing env vars`)

	const guild = client.guilds.cache.get(guildId)
	if (!guild) return console.error(`Guild not found`)

	const textChannel = guild.channels.cache.get(textChannelId) as TextChannel
	if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel`)

	const servers = ((await getAllServers()) ?? []) as db_server[]
	const players = ((await getAllPlayers()) ?? []) as db_online_player[]
	const { embed, total_online } = buildPlayersEmbed(servers, players)

	const newName = `Players Online: ${total_online}`
	await client.user?.setActivity(newName, { type: ActivityType.Custom })

	try {
		const newEmbedJSON = JSON.stringify(embed.toJSON())
		const lastEmbedJSON = await Flashcore.get<string>('players_embed_cache')

		if (newEmbedJSON !== lastEmbedJSON) {
			let edited = false
			if (messageId) {
				try {
					const msg = await textChannel.messages.fetch(messageId)
					await msg.edit({ embeds: [embed] })
					edited = true
				} catch (err) {
					// only post a new list if the old message is actually gone; for any other error
					// (rate limit, network blip) keep the old one and try again on the next update
					if (!(err instanceof DiscordAPIError && err.code === RESTJSONErrorCodes.UnknownMessage)) throw err
				}
			}
			if (!edited) {
				// clear out any stray lists first so there is only ever one
				await deletePlayersMessages(textChannel)
				const msg = await textChannel.send({ embeds: [embed] })
				await Flashcore.set('players_msg_id', msg.id)
			}
			await Flashcore.set('players_embed_cache', newEmbedJSON)
		}
	} catch (err) {
		log.error(`Failed to update player embed message: ${err}`)
	}
}

// ids of servers whose last player fetch failed, so an unreachable server is posted to discord
// once when it goes down (and once when it recovers) instead of on every 10s poll
const unreachable_servers = new Set<string>()

function reportServerFailure(server: db_server, msg: string) {
	if (unreachable_servers.has(server.id)) return console.error(msg)
	unreachable_servers.add(server.id)
	log.error(`${msg} (won't be posted again until it recovers)`)
}

function reportServerSuccess(server: db_server) {
	if (unreachable_servers.delete(server.id)) log.success(`${server.name} is reachable again`)
}

// fetches the online player list for a server, normalizing paper/fabric response shapes
// returns null if the server is unreachable or returns a non-ok response
export async function fetchServerPlayers(server: db_server, opts?: { signal?: AbortSignal }): Promise<player[] | null> {
	try {
		const res = await fetch(`${server.host}:${server.port}/api/players`, {
			headers: { Authorization: `Bearer ${server_auth_header(server)}` },
			signal: opts?.signal
		})

		if (!res.ok) {
			reportServerFailure(server, `Error getting ${server.name} players: HTTP ${res.status}`)
			return null
		}
		reportServerSuccess(server)

		if (server.type === 'fabric') {
			const data = (await res.json()) as fabric_players
			return fabricPlayersToPlayers(data.players ?? [])
		}

		const data = (await res.json()) as connected_players
		return data.online_players ?? []
	} catch (err) {
		reportServerFailure(server, `Failed to fetch ${server.name} players: ${err}`)
		return null
	}
}

export async function refreshOnlinePlayers() {
	const servers = (await getAllServers()) as db_server[]
	for (const server of servers) {
		const players = await fetchServerPlayers(server)
		if (players === null) continue
		await updateServerPlayers(server.id, players)

		for (const player of players) {
			const profile = await getProfileByMcUuid(player.uuid)
			if (profile?.user_id) {
				await addPlaytime(profile.user_id, 30)
			}
		}
	}
}

export function fabricPlayersToPlayers(fabricPlayers: fabric_player[]): player[] {
	return fabricPlayers.map((p) => ({
		name: p.name,
		uuid: p.uuid,
		health: null,
		gamemode: null,
		level: 0
	}))
}
