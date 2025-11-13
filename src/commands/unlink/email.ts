import { GuildMember, Role, type ChatInputCommandInteraction } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import {
	db_player,
	getMemberId,
	getProfileByDId,
	getSettingByid,
	log,
	mc_command,
	role_settings,
	updateMember,
	updatePlayerProfile
} from '~/utill'

export const config = createCommandConfig({
	description: 'unlink you email this will lose your member status',
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

	if (!profile.uea_email) return `you dont have a linked email`

	const member_stat = await getMemberId(profile.uea_email)

	if (member_stat) await updateMember(profile.uea_email, ``)

	if (profile.mc_rank === `member`) {
		await mc_command(`a406fbb6-418d-4160-8611-1c180d33da14`, `lp user ${profile.mc_uuid} parent set verified`)
		profile.mc_rank = `verified`
	}

	profile.uea_email = ``

	await updatePlayerProfile(profile.user_id, profile)

	const roles = (await getSettingByid(`roles`)) as role_settings
	const member_roles = (await guild.members.fetch(profile.user_id)) as GuildMember

	log.msg(`${member_roles.nickname} has unlinked there email account: ${profile.uea_email}`)

	if (
		guild.members.me.roles.highest.comparePositionTo(member_roles.roles.highest) > 0 &&
		member_roles.id !== guild.ownerId
	) {
		await member_roles.roles.remove((await guild.roles.cache.get(roles.setting.email_verified)) as Role)
		await member_roles.roles.remove((await guild.roles.cache.get(roles.setting.member)) as Role)
	}
	return `Removed email from account you can relink as anytime`
}
