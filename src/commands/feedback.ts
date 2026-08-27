import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction, TextChannel } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { log } from '~/utill'

export const config = createCommandConfig({
	description: 'Send anonymous feedback or a bug report to the committee',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'message',
			description: 'your feedback or bug report',
			type: 'string',
			required: true
		}
	],
	sage: { ephemeral: true }
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const message = options.message as string

	const channel = interaction.guild?.channels.cache.get(process.env.FEEDBACK_CHANNEL_ID) as TextChannel | undefined
	if (!channel?.isTextBased() || !channel.isSendable()) {
		log.error('Feedback channel not found or not sendable')
		return { content: '❌ Feedback could not be delivered right now. Try again later.', flags: ['Ephemeral'] }
	}

	await channel.send({
		embeds: [
			new EmbedBuilder().setColor('Purple').setTitle('📬 Anonymous Feedback').setDescription(message).setTimestamp()
		]
	})

	return { content: '✅ Feedback sent anonymously. Thank you!', flags: ['Ephemeral'] }
}
