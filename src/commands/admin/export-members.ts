import { AttachmentBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandResult } from 'robo.js'
import { getAllLinkedMembers, getProfileByDId, db_player, log } from '~/utill'

export const config = createCommandConfig({
	description: 'Export all linked society members as a CSV',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	defaultMemberPermissions: PermissionFlagsBits.ManageRoles
} as const)

export default async (interaction: ChatInputCommandInteraction): Promise<CommandResult> => {
	await interaction.deferReply({ ephemeral: true })

	try {
		const members = await getAllLinkedMembers()

		const rows = await Promise.all(
			members.map(async (m) => {
				const profile = (await getProfileByDId(m.user_id)) as db_player | null
				return [m.id, m.user_id, profile?.mc_username ?? '', profile?.uea_email ?? '', profile?.mc_rank ?? '']
					.map((v) => `"${String(v).replace(/"/g, '""')}"`)
					.join(',')
			})
		)

		const csv = ['uea_id,discord_user_id,mc_username,uea_email,mc_rank', ...rows].join('\n')
		const file = new AttachmentBuilder(Buffer.from(csv, 'utf-8'), { name: `members-${Date.now()}.csv` })

		log.msg(`Admin exported ${members.length} members to CSV`)

		await interaction.editReply({ content: `Exported **${members.length}** members.`, files: [file] })
	} catch (err) {
		log.error(`Admin export-members failed: ${err}`)
		await interaction.editReply({ content: `❌ Export failed: ${err}` })
	}
}
