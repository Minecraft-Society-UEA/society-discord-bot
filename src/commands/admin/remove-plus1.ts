import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { db_player, mc_command, online_server_check, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Remove a committee member\'s plus-1 assignment',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the committee member whose plus-1 to remove',
			type: 'member',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	if (!interaction.guild) return

	const user = options.user
	if (!user) return { content: 'Invalid user', flags: ['Ephemeral'] }

	const plus1 = (await Flashcore.get<db_player>(`${user.id}-plus1`))

	if (!plus1) {
		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Orange')
					.setTitle(`⚠️ No plus-1 found`)
					.setDescription(`${user} does not have an active plus-1 assignment.`)
			],
			flags: ['Ephemeral']
		}
	}

	// Remove LuckPerms group if their plus-1 is online
	if (plus1.mc_username) {
		const online = await online_server_check(plus1.mc_username)
		if (online) {
			await mc_command(online, `lp user ${plus1.mc_username} parent remove plus-1`).catch((err) =>
				log.warn(`remove-plus1: LP removal failed for ${plus1.mc_username}: ${err}`)
			)
		}
	}

	await Flashcore.delete(`${user.id}-plus1`)

	log.msg(`Admin removed plus-1 (${plus1.mc_username}) from ${user.displayName}`)

	return {
		embeds: [
			new EmbedBuilder()
				.setColor('Green')
				.setTitle('✅ Plus-1 removed')
				.setDescription(`Removed **${plus1.mc_username}** as ${user}'s plus-1.`)
		],
		flags: ['Ephemeral']
	}
}
