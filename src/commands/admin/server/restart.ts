import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { pterodactyl_power, getServerByID, servers_req, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Restart a server via Pterodactyl',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [servers_req],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const server_id = options.server as string

	await interaction.deferReply({ ephemeral: true })

	try {
		const server = await getServerByID(server_id)
		await pterodactyl_power(server_id, 'restart')
		log.msg(`Admin restarted ${server?.name ?? server_id} via Pterodactyl`)

		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Orange').setTitle('🔄 Server restarting').setDescription(`**${server?.name ?? server_id}** is restarting.`)]
		})
	} catch (err) {
		log.error(`Server restart failed: ${err}`)
		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Restart failed').setDescription(`${err}`)]
		})
	}
}
