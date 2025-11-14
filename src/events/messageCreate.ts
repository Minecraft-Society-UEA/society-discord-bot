import { ChannelType, EmbedBuilder, GuildMember, Message, ThreadChannel } from 'discord.js'
import { Flashcore, client } from 'robo.js'
import { getSettingByid, modmailSettings, ModMailUserData } from '~/utill'

export default async (message: Message) => {
	if (message.channel.type === ChannelType.PublicThread || message.channel.type === ChannelType.PrivateThread) {
		if (message.author.bot) {
			return
		}
		const threadUserData = await retrieveModmailDataFromFlashcore(message.channelId, '')
		const guild = await client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
		if (!guild) return console.error(`Guild not found`)
		const member = (await guild.members.fetch(message.author.id)) as GuildMember

		if (threadUserData) {
			const modalOptions = (await getSettingByid(`modmail`)) as modmailSettings

			const embedded = new EmbedBuilder()
				.setTitle(modalOptions.setting.customMsg.title ? modalOptions.setting.customMsg.title : member.nickname)
				.setColor(`Purple`)
				.setDescription(message.content.length > 0 ? message.content : ' ')
				.setFooter({
					text: modalOptions.setting.customMsg.footer
						? modalOptions.setting.customMsg.footer
						: 'The lovely moderation team ^.^'
				})

			const user = await client.users.fetch(threadUserData.userId)
			if (user) {
				user.send({ embeds: [embedded], files: [...message.attachments.map((attach) => attach.url)] })
			}
		}
		return
	}
	if (message.channel.type === ChannelType.DM && !message.author.bot) {
		const modmailChannel = await Flashcore.get<string>('modmail_forum')

		if (!modmailChannel) {
			return message.reply({
				content:
					'Please contact the adminstrators of the server to set a modmail channel using the /modmail channel command.',
				options: { ephemeral: true }
			})
		}

		const ForumMail = await client.channels.fetch(modmailChannel)
		if (ForumMail && ForumMail.type === ChannelType.GuildForum) {
			const guild = await client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
			if (!guild) return console.error(`Guild not found`)
			const member = (await guild.members.fetch(message.author.id)) as GuildMember
			const hasAlreadyAThread = await createOrFetchThreadChannel(message, ForumMail, member)

			if (!hasAlreadyAThread) {
				const modalOptions = (await getSettingByid(`modmail`)) as modmailSettings

				const embedded = new EmbedBuilder()
					.setTitle(modalOptions.setting.introMsg.title ? modalOptions.setting.introMsg.title : 'Thread created')
					.setColor(`Purple`)
					.setDescription(
						modalOptions.setting.introMsg.description
							? modalOptions.setting.introMsg.description
							: 'Please state your issues.'
					)
					.setFooter({
						text: modalOptions.setting.introMsg.footer
							? modalOptions.setting.introMsg.footer
							: 'The lovely moderation team ^.^'
					})
				return message.reply({ embeds: [embedded] })
			} else {
				if (hasAlreadyAThread instanceof ThreadChannel) {
					return hasAlreadyAThread.send({
						content: message.content.length > 0 ? message.content : ' ',
						files: [...message.attachments.map((attach) => attach.url)]
					})
				}
			}
		}
	}
}

const createOrFetchThreadChannel = async (
	message: Message,
	Forum: any,
	member: GuildMember
): Promise<ThreadChannel | boolean> => {
	const user =
		((await retrieveModmailDataFromFlashcore('', message.author.id)) as ModMailUserData) ??
		({ threadId: ``, userId: `` } as ModMailUserData)
	const threads = (await Forum.threads.fetch()).threads
	const userThread = threads.find((thread: ThreadChannel) => thread.id === user.threadId)

	if (!userThread) {
		const newThread = await Forum.threads.create({
			name: member.nickname,
			message: { content: message.content }
		})
		await saveModmailDataToFlashcore(newThread.id, message.author.id)
		return false
	} else {
		return userThread
	}
}

const retrieveModmailDataFromFlashcore = async (thread: string, userId: string) => {
	const user = await Flashcore.get<ModMailUserData>(thread ? thread : userId, {
		namespace: 'modmail_thread'
	})

	return user
}

const saveModmailDataToFlashcore = async (threadId: string, userId: string) => {
	await Flashcore.set<ModMailUserData>(
		threadId,
		{
			threadId: threadId,
			userId: userId
		},
		{
			namespace: 'modmail_thread'
		}
	)
	await Flashcore.set<ModMailUserData>(
		userId,
		{
			threadId: threadId,
			userId: userId
		},
		{
			namespace: 'modmail_thread'
		}
	)
}
