import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { pterodactyl_power, getServerByID, servers_req, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Start a server via Pterodactyl',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [servers_req],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const server_id = options.server as string

	await interaction.deferReply({ ephemeral: true })

	try {
		const server = await getServerByID(server_id)
		await pterodactyl_power(server_id, 'start')
		log.msg(`Admin started ${server?.name ?? server_id} via Pterodactyl`)

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor('Green')
					.setTitle('▶️ Server starting')
					.setDescription(`**${server?.name ?? server_id}** is starting.`)
			]
		})
	} catch (err) {
		log.error(`Server start failed: ${err}`)
		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Start failed').setDescription(`${err}`)]
		})
	}
}
