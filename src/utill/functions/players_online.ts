import { TextChannel, EmbedBuilder, ActivityType } from 'discord.js'
import { Flashcore, client } from 'robo.js'
import {
	getAllServers,
	getAllPlayers,
	server_token_resolver,
	updateServerPlayers,
	log,
	db_online_player,
	connected_players,
	db_server
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

export async function refreshOnlinePlayers() {
	const servers = (await getAllServers()) as db_server[]
	for (const server of servers) {
		try {
			const res = await fetch(`${server.host}/api/players`, {
				headers: { Authorization: `Bearer ${server_token_resolver(server.id)}` }
			})

			if (!res.ok) {
				log.error(`Error getting ${server.name} players.`)
				return
			}

			const data = (await res.json()) as connected_players

			if (data.online_players && data.online_players.length > 0)
				await updateServerPlayers(server.id, data.online_players)
			else await updateServerPlayers(server.id, [])
		} catch (err) {
			log.error(`Failed to fetch ${server.name} players: ${err}`)
			return
		}
	}
}
