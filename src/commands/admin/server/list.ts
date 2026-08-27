import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getAllServersAll, db_server } from '~/utill'

export const config = createCommandConfig({
	description: 'List all servers in the database and their last known online count',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	const servers = (await getAllServersAll()) as db_server[] | null
	if (!servers) {
		return { content: '❌ No servers found in the database.', flags: ['Ephemeral'] }
	}

	const embed = new EmbedBuilder().setTitle('🖥️ Servers').setColor('Blue')

	for (const server of servers) {
		embed.addFields({
			name: `${server.emoji ?? ''} ${server.name}`.trim(),
			value: [`Type: \`${server.type}\``, `Online: ${server.currently_online ?? 0} players`].join('\n'),
			inline: true
		})
	}

	return { embeds: [embed], flags: ['Ephemeral'] }
}
