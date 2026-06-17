import { TextChannel, EmbedBuilder, ActivityType } from 'discord.js'
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
	player
} from '~/utill'

export async function updatePlayersChannel() {
	console.log(`updating players channel`)
	const guildId = process.env.DISCORD_GUILD_ID
	const textChannelId = process.env.SERVER_LIST_CHANNEL_ID
	const messageId = (await Flashcore.get<string>(`players_msg_id`)) ?? undefined

	if (!guildId || !textChannelId) return console.error(`Missing env vars`)

	const guild = client.guilds.cache.get(guildId)
	if (!guild) return console.error(`Guild not found`)

	const textChannel = guild.channels.cache.get(textChannelId) as TextChannel
	if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel`)

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

	embed.setDescription(`Online: ${totalOnline}`)

	const newName = `👥 Online: ${totalOnline}`
	await client.user?.setActivity(newName, { type: ActivityType.Custom })

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
		log.error(`Failed to update player embed message: ${err}`)
	}
}

// fetches the online player list for a server, normalizing paper/fabric response shapes
// returns null if the server is unreachable or returns a non-ok response
export async function fetchServerPlayers(server: db_server, opts?: { signal?: AbortSignal }): Promise<player[] | null> {
	try {
		const res = await fetch(`${server.host}/api/players`, {
			headers: { Authorization: `Bearer ${server_auth_header(server)}` },
			signal: opts?.signal
		})

		if (!res.ok) {
			log.error(`Error getting ${server.name} players.`)
			return null
		}

		if (server.type === 'fabric') {
			const data = (await res.json()) as fabric_players
			return fabricPlayersToPlayers(data.players ?? [])
		}

		const data = (await res.json()) as connected_players
		return data.online_players ?? []
	} catch (err) {
		log.error(`Failed to fetch ${server.name} players: ${err}`)
		return null
	}
}

export async function refreshOnlinePlayers() {
	const servers = (await getAllServers()) as db_server[]
	for (const server of servers) {
		const players = await fetchServerPlayers(server)
		if (players === null) continue
		await updateServerPlayers(server.id, players)
	}
}

export function fabricPlayersToPlayers(fabricPlayers: fabric_player[]): player[] {
	return fabricPlayers.map((p) => ({
		name: p.name,
		uuid: p.uuid,
		health: p.health,
		gamemode: p.game_mode,
		level: 0
	}))
}
