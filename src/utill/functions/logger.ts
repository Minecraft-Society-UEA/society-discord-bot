import { RGBTuple, EmbedBuilder, TextChannel } from 'discord.js'
import { client } from 'robo.js'

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
