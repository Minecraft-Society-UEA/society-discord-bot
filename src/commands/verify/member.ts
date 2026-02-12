import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	EmbedBuilder,
	GuildMember,
	Role
} from 'discord.js'
import { CommandResult, createCommandConfig, Flashcore } from 'robo.js'
import {
	role_storage,
	getSettingByid,
	getProfileByDId,
	db_player,
	getMemberUserId,
	validateMembers,
	fetchTableHtml,
	extractIds,
	createMembers,
	log
} from '~/utill'

// the command config pretty simple json there are more option avlible check robo.js docs
// command name is the file name and if in any folders in the command folders are treated as sub commands
export const config = createCommandConfig({
	description: 'CLICK HERE to confirm that you are a society member.',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall']
} as const)

type role_settings = {
	setting: role_storage
}

// the main code that executes when the command is used
export default async (
	// interaction in the interaction coming from discord for the command
	interaction: ChatInputCommandInteraction
): Promise<CommandResult> => {
	// declaring variables we need
	if (!interaction.guild || !interaction.guild.members.me) return `invalid guild`
	const lastUsed = (await Flashcore.get('lastused')) as number | null
	const now = Date.now()
	const embed = new EmbedBuilder()
	const button = new ButtonBuilder()
	const roles = (await getSettingByid(`roles`)) as role_settings
	const profile = (await getProfileByDId(interaction.user.id)) as db_player
	const member0 = await getMemberUserId(interaction.user.id)
	const role = (await interaction.guild.roles.cache.get(roles.setting.unverified)) as Role
	const member_roles = interaction.member as GuildMember
	if (member0) {
		if (
			interaction.guild.members.me?.roles.highest.comparePositionTo(member_roles.roles.highest) > 0 &&
			member_roles.id !== interaction.guild.ownerId
		) {
			await member_roles.roles.add((await interaction.guild.roles.cache.get(roles.setting.member)) as Role)
		}
		return {
			embeds: [
				embed
					.setTitle(`✦ You are already a linked member! — we have checked your roles add added member if needed`)
					.setColor(`Green`)
			]
		}
	} else if (!member0) {
		if (!profile) {
			return { content: `You need to link you mc account with /verify mc` }
		}
		if (!profile.uea_email) {
			return { content: `You need to link you email with /verify email` }
		}

		if (lastUsed && now - lastUsed < 5 * 60 * 1000) {
			const remaining = Math.floor((lastUsed + 5 * 60 * 1000) / 1000)

			return {
				content: `${role}`,
				embeds: [embed.setTitle(`😴 Command is on cooldown — wait <t:${remaining}:R>`).setColor('Red')]
			}
		} else {
			await Flashcore.set('lastused', now)
			await validateMembers()

			const member = await getMemberUserId(interaction.user.id)
			if (!member) {
				const html = await fetchTableHtml()
				if (!html) {
					await Flashcore.delete('lastused')
					return {
						content: `${role}`,
						embeds: [embed.setTitle(`gettiong members failed`).setColor('Red')]
					}
				}
				const ids = await extractIds(html)
				await createMembers(ids)
				log.info(`saved members from html`)
				await validateMembers()
				const member2 = await getMemberUserId(interaction.user.id)
				if (!member2) {
					return {
						embeds: [embed.setTitle(`✦ Not a member yet — get a membership below`).setColor(`Orange`)],
						components: [
							new ActionRowBuilder<ButtonBuilder>().addComponents(
								button
									.setLabel(`Become A Member!`)
									.setURL(`https://www.ueasu.org/communities/societies/group/minecraft/`)
									.setStyle(ButtonStyle.Link)
									.setEmoji(`🌟`)
							)
						]
					}
				} else {
					await member_roles.roles.add((await interaction.guild.roles.cache.get(roles.setting.member)) as Role)
					return {
						embeds: [
							embed
								.setTitle(`🤩 Nice! Your member status has been linked to Minecraft, you can now access our servers!`)
								.setColor(`Green`)
						]
					}
				}
			} else {
				await member_roles.roles.add((await interaction.guild.roles.cache.get(roles.setting.member)) as Role)
				return {
					embeds: [
						embed
							.setTitle(`🤩 Nice! Your member status has been linked to Minecraft, you can now access our servers!`)
							.setColor(`Green`)
					]
				}
			}
		}
	}
}
