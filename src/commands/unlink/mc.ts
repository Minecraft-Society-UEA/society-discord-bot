import { GuildMember, Role, type ChatInputCommandInteraction } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	db_player,
	getProfileByDId,
	getSettingByid,
	log,
	mc_command,
	role_settings,
	updatePlayerProfile
} from '~/utill'

export const config = createCommandConfig({
	description: 'unlink your minecraft account this will remove you ability to join the smp',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall']
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const profile = (await getProfileByDId(interaction.user.id)) as db_player
	if (!profile) return `invalid profile`
	const guild = interaction.guild
	if (!guild || !guild.members.me) return `Guild not found`

	await mc_command(`a406fbb6-418d-4160-8611-1c180d33da14`, `lp user ${profile.mc_uuid} parent set default`)

	profile.mc_rank = `unverified`
	profile.mc_username = ``
	profile.mc_uuid = ``

	await updatePlayerProfile(profile.user_id, profile)

	const roles = (await getSettingByid(`roles`)) as role_settings
	const member_roles = (await guild.members.fetch(profile.user_id)) as GuildMember

	log.msg(`${member_roles.nickname} has unlinked the mc account: ${profile.mc_username}`)

	if (
		guild.members.me.roles.highest.comparePositionTo(member_roles.roles.highest) > 0 &&
		member_roles.id !== guild.ownerId
	) {
		if (member_roles.nickname)
			await member_roles.setNickname(member_roles.nickname.split(` ✧ `)[0] ?? member_roles.displayName)
		await member_roles.roles.remove((await guild.roles.cache.get(roles.setting.mc_verified)) as Role)
		await member_roles.roles.add((await guild.roles.cache.get(roles.setting.unverified)) as Role)
	}
	return `unlinked your mc account you can relink ta any time`
}
