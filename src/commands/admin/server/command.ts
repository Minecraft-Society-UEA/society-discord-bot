import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { mc_command, log, servers_req } from '~/utill'

export const config = createCommandConfig({
	description: 'Run an arbitrary console command on a server',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		servers_req,
		{
			name: 'command',
			description: 'the console command to run',
			type: 'string',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const serverId = options.server as string
	const command = options.command as string

	await interaction.deferReply({ ephemeral: true })

	try {
		const result = await mc_command(serverId, command)
		log.msg(`Admin ran MC command on ${serverId}: ${command}`)

		const embed = new EmbedBuilder()
			.setColor('Green')
			.setTitle('✅ Command sent')
			.addFields(
				{ name: 'Command', value: `\`${command}\``, inline: false },
				{ name: 'Response', value: result ? `\`\`\`${JSON.stringify(result, null, 2).slice(0, 900)}\`\`\`` : 'No response body', inline: false }
			)

		await interaction.editReply({ embeds: [embed] })
	} catch (err) {
		log.error(`Admin server command failed: ${err}`)
		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Command failed').setDescription(`${err}`)]
		})
	}
}
