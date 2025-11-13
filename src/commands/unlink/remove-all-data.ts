import { GuildMember, Role, type ChatInputCommandInteraction } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	db_player,
	deletePlayerProfile,
	getProfileByDId,
	getSettingByid,
	log,
	mc_command,
	role_settings,
	updateMember
} from '~/utill'

export const config = createCommandConfig({
	description: 'removes all data involing your chareter including email, member status and mc account',
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
	await deletePlayerProfile(profile.user_id)
	if (profile.uea_email) await updateMember(profile.uea_email, ``)

	const roles = (await getSettingByid(`roles`)) as role_settings
	const member_roles = (await guild.members.fetch(profile.user_id)) as GuildMember

	log.msg(`${member_roles.nickname} has opted to remove all data relating to them`)

	if (
		guild.members.me.roles.highest.comparePositionTo(member_roles.roles.highest) > 0 &&
		member_roles.id !== guild.ownerId
	) {
		if (member_roles.nickname) await member_roles.setNickname(member_roles.nickname.split(` ✧ `)[0])
		else await member_roles.setNickname(member_roles.displayName)
		await member_roles.roles.remove([
			(await guild.roles.cache.get(roles.setting.member)) as Role,
			(await guild.roles.cache.get(roles.setting.email_verified)) as Role,
			(await guild.roles.cache.get(roles.setting.mc_verified)) as Role,
			(await guild.roles.cache.get(roles.setting.tester)) as Role
		])
		await member_roles.roles.add((await guild.roles.cache.get(roles.setting.unverified)) as Role)
	}
	return `removed all data associated with your account you can relink anytime`
}
