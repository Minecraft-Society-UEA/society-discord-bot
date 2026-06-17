import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, deleteBanByUserId, getBansByUserId, pterodactyl_command, db_player, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Unban a player via LibertyBans on the proxy (and remove from DB)',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the Discord user to unban',
			type: 'member',
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const user = options.user
	if (!user) return { content: 'Invalid user', flags: ['Ephemeral'] }

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

	const bans = await getBansByUserId(user.id)
	if (!bans.length) {
		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Orange')
					.setTitle('⚠️ No active ban found')
					.setDescription(`${user} has no bans on record.`)
			],
			flags: ['Ephemeral']
		}
	}

	await interaction.deferReply({ ephemeral: true })

	try {
		await pterodactyl_command(`unban ${profile.mc_username}`)
		await deleteBanByUserId(user.id)

		log.msg(`Admin unbanned ${profile.mc_username}`)

		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor('Green')
					.setTitle('✅ Player unbanned')
					.setDescription(`**${profile.mc_username}** (${user}) has been unbanned via LibertyBans.`)
			]
		})
	} catch (err) {
		log.error(`Admin unban failed for ${profile.mc_username}: ${err}`)
		await interaction.editReply({
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Unban failed').setDescription(`${err}`)]
		})
	}
}
