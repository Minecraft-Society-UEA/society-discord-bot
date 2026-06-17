import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { pterodactyl_power, getServerByID, servers_req, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Stop a server via Pterodactyl',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		servers_req,
		{
			name: 'confirm',
			description: 'Set to true to confirm — this will immediately stop the server and boot all players',
			type: 'boolean',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	if (!options.confirm) {
		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Orange')
					.setTitle('⚠️ Cancelled')
					.setDescription('Set `confirm` to `true` to proceed. This will stop the server and disconnect all players.')
			],
			flags: ['Ephemeral']
		}
	}

	const server_id = options.server as string

	await interaction.deferReply({ ephemeral: true })

	try {
		const server = await getServerByID(server_id)
		await pterodactyl_power(server_id, 'stop')
		log.msg(`Admin stopped ${server?.name ?? server_id} via Pterodactyl`)

		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('⏹️ Server stopped').setDescription(`**${server?.name ?? server_id}** has been stopped.`)]
		})
	} catch (err) {
		log.error(`Server stop failed: ${err}`)
		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Stop failed').setDescription(`${err}`)]
		})
	}
}
