import { EmbedBuilder, GuildMember, Role, type ChatInputCommandInteraction } from 'discord.js'
import { createCommandConfig, Flashcore } from 'robo.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, updatePlayerProfile } from '~/utill/database_functions'
import { mc_command, message_player, online_server_check } from '~/utill/functions'
import { checksarr, db_player, role_storage } from '~/utill/types'

export const config = createCommandConfig({
	description: 'double checks your status and promotes bedrock account if nto already',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall']
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	if (!interaction.guild) return
	const profile = (await getProfileByDId(interaction.user.id)) as db_player
	const member = interaction.member as GuildMember
	const embed = new EmbedBuilder()
	const kvarr = [] as checksarr[]
	const roles = (await Flashcore.get(`mc_role_id`)) as role_storage
	const role = (await interaction.guild.roles.cache.get(roles.tester)) as Role

	if (profile.mc_rank === `tester`) {
		if (!member.roles.cache.has(roles.tester)) {
			await member.roles.add(role)
		}

		if (profile.bed_mc_username) {
			const online = await online_server_check(profile.bed_mc_username)
			if (!online) {
				kvarr.push({
					key: `making bedrock acc tester: `,
					value: `Failed to make bedrock account a tester account offline`
				})
			} else {
				await mc_command(online, `lp user ${profile.bed_mc_username} parent set beta-tester`)
				await message_player(profile.bed_mc_username, `[MC-UEA VERIFY] Successfully Become a Tester :tada:`)

				kvarr.push({
					key: `making bedrock acc tester: `,
					value: `✦ Successfully made ${member} (${profile.bed_mc_username}) a beta tester! Join the server and do \`/game\` to join the world.`
				})
			}
		}
	} else {
		if (member.roles.cache.has(roles.tester)) {
			await member.roles.remove(role)
			kvarr.push({
				key: `your no longer a tester: `,
				value: `tester role removed`
			})
		}
	}

	kvarr.map((checks) => {
		embed.addFields({
			name: checks.key,
			value: checks.value
		})
	})

	return { embeds: [embed] }
}
