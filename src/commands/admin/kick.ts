import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, online_server_check, mc_command, db_player, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Kick a player from whichever Minecraft server they are currently on',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the Discord user to kick',
			type: 'member',
			required: true
		},
		{
			name: 'reason',
			description: 'reason for the kick',
			type: 'string',
			required: false
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const user = options.user
	if (!user) return { content: 'Invalid user', flags: ['Ephemeral'] }

	const reason = options.reason ?? 'Kicked by committee'

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

	const serverId = await online_server_check(profile.mc_username)
	if (!serverId) {
		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Orange')
					.setTitle('⚠️ Player not online')
					.setDescription(`**${profile.mc_username}** is not currently online on any server.`)
			],
			flags: ['Ephemeral']
		}
	}

	try {
		await mc_command(serverId, `kick ${profile.mc_username} ${reason}`)
		log.msg(`Admin kicked ${profile.mc_username} — reason: ${reason}`)

		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Green')
					.setTitle('✅ Player kicked')
					.addFields(
						{ name: 'Player', value: profile.mc_username, inline: true },
						{ name: 'Reason', value: reason, inline: true }
					)
			],
			flags: ['Ephemeral']
		}
	} catch (err) {
		log.error(`Admin kick failed for ${profile.mc_username}: ${err}`)
		return {
			embeds: [new EmbedBuilder().setColor('Red').setTitle('❌ Kick failed').setDescription(`${err}`)],
			flags: ['Ephemeral']
		}
	}
}
