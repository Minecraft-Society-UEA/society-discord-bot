import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, createBan, pterodactyl_command, parseLibertyBansDuration, db_player, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Ban a player via LibertyBans on the proxy (and record in DB)',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the Discord user to ban',
			type: 'member',
			required: true
		},
		{
			name: 'reason',
			description: 'reason for the ban',
			type: 'string',
			required: true
		},
		{
			name: 'duration',
			description: 'ban duration in LibertyBans format: 30m, 24h, 5d, 1mo — omit for permanent',
			type: 'string',
			required: false
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const user = options.user
	if (!user) return { content: 'Invalid user', flags: ['Ephemeral'] }

	const reason = options.reason as string
	const duration = (options.duration as string | undefined) ?? ''

	const profile = (await getProfileByDId(user.id)) as db_player | null
	if (!profile?.mc_username) {
		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Red')
					.setTitle('❌ No MC account linked')
					.setDescription(`${user} does not have a linked Minecraft account.`)
			],
			flags: ['Ephemeral']
		}
	}

	await interaction.deferReply({ ephemeral: true })

	// LibertyBans format: /ban <player> [duration] <reason>
	const liberty_command = duration
		? `ban ${profile.mc_username} ${duration} ${reason}`
		: `ban ${profile.mc_username} ${reason}`

	const durationMinutes = parseLibertyBansDuration(duration)

	try {
		await pterodactyl_command(liberty_command)
		await createBan(user.id, reason, durationMinutes)

		log.msg(`Admin banned ${profile.mc_username}${duration ? ` for ${duration}` : ' permanently'} — reason: ${reason}`)

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor('Red')
					.setTitle('🔨 Player banned')
					.addFields(
						{ name: 'Player', value: `${user} (${profile.mc_username})`, inline: false },
						{ name: 'Reason', value: reason, inline: true },
						{ name: 'Duration', value: duration || 'Permanent', inline: true }
					)
			]
		})
	} catch (err) {
		log.error(`Admin ban failed for ${profile.mc_username}: ${err}`)
		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Ban failed').setDescription(`${err}`)]
		})
	}
}
