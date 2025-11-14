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
		const embed = new EmbedBuilder()
		const msg = (await messageReaction.message) as Message
		const member = (await Guild.members.fetch(msg.author.id)) as GuildMember
		const member_save = (await Guild.members.fetch(user.id)) as GuildMember
		const textChannel = (await Guild.channels.cache.get(process.env.QUOTE_WALL_CHANNEL_ID)) as TextChannel
		if (!textChannel?.isTextBased() || !textChannel.isSendable()) return console.error(`Invalid text channel`)

		embed
			.setAuthor({
				name: member.nickname ?? member.displayName,
				iconURL: await msg.author.displayAvatarURL()
			})
			.setTitle(msg.content)
			.setTimestamp()

		const attachment = msg.attachments.first()

		if (attachment) {
			embed.setImage(attachment.url)
		}

		const msgid = await textChannel.send({
			embeds: [embed],
			content: `Message by ${member} has been stared by ${member_save}. ${msg.url}`
		})

		await Flashcore.set(`${msg.id}-${user.id}`, msgid.id)
	}
}
