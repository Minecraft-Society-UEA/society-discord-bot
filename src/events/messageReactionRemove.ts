import { EmbedBuilder, Guild, GuildMember, Message, MessageReaction, TextChannel, User } from 'discord.js'
import { Flashcore } from 'robo.js'

export default async (messageReaction: MessageReaction, user: User) => {
	if (messageReaction.partial || messageReaction.message.partial) {
		await messageReaction.fetch()
		await messageReaction.message.fetch()
	}

	if (messageReaction.emoji.name === `staruea`) {
		const Guild = (await messageReaction.message.guild) as Guild
		if (!Guild) return `invalid guild`
		const msg = (await messageReaction.message) as Message
		const msgid = (await Flashcore.get(`${msg.id}-${user.id}`)) as string
		const textChannel = (await Guild.channels.cache.get(process.env.QUOTE_WALL_CHANNEL_ID)) as TextChannel
		if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel`)
		const message = await textChannel.messages.fetch(msgid).catch(() => null)

		if (!message) {
			console.error('Message not found')
			return
		}

		await message.delete()
		await Flashcore.delete(msg.id)
	}
}
