import { EmbedBuilder, PermissionFlagsBits } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'
import { getProfileByDId, updatePlayerProfile, db_player, mc_rank_type, log, mc_command, HUB_SERVER_ID } from '~/utill'

export const config = createCommandConfig({
	description: "Directly set a player's rank in the database (manual override, bypasses the verify flow)",
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'user',
			description: 'the user to update',
			type: 'member',
			required: true
		},
		{
			name: 'rank',
			description: 'the rank to set',
			type: 'string',
			choices: [
				{ name: 'unverified', value: 'unverified' },
				{ name: 'verified', value: 'verified' },
				{ name: 'member', value: 'member' },
				{ name: 'tester', value: 'tester' },
				{ name: 'admin', value: 'admin' },
				{ name: 'committee', value: 'committee' },
				{ name: 'plus1', value: 'plus1' },
			],
			required: true
		}
	],
	defaultMemberPermissions: PermissionFlagsBits.Administrator
} as const)

export default async (
	interaction: ChatInputCommandInteraction,
	options: CommandOptions<typeof config>
): Promise<CommandResult> => {
	const user = options.user
	if (!user) return { content: 'Invalid user', flags: ['Ephemeral'] }

	const rank = options.rank as mc_rank_type

	const profile = (await getProfileByDId(user.id)) as db_player | null
	if (!profile) {
		return {
			embeds: [
				new EmbedBuilder()
					.setColor('Red')
					.setTitle('❌ No profile found')
					.setDescription(`${user} has not verified yet.`)
			],
			flags: ['Ephemeral']
		}
	}

	profile.mc_rank = rank
	await updatePlayerProfile(user.id, profile)

	if (profile.mc_uuid) {
		try {
			const rankCommands: Record<mc_rank_type, string> = {
				unverified: `lp user ${profile.mc_uuid} parent set default`,
				verified: `lp user ${profile.mc_uuid} parent set verified`,
				member: `lp user ${profile.mc_uuid} parent set soc-member`,
				tester: `lp user ${profile.mc_uuid} parent set beta-tester`,
				admin: `lp user ${profile.mc_uuid} parent set server-admin`,
				plus1: `lp user ${profile.mc_uuid} parent set plus-1`,
				committee: `lp user ${profile.mc_uuid} parent set committee`
			}

			await mc_command(HUB_SERVER_ID, rankCommands[rank])
			log.msg(`Admin set ${user.displayName}'s rank to ${rank} (DB + in-game LuckPerms updated)`)

			return {
				embeds: [
					new EmbedBuilder()
						.setColor('Green')
						.setTitle('✅ Rank updated')
						.setDescription(`Set ${user}'s rank to **${rank}**.\nDatabase and in-game LuckPerms groups have been updated.`)
				],
				flags: ['Ephemeral']
			}
		} catch (err) {
			log.error(`Failed to update LuckPerms rank for ${user.displayName}: ${err}`)
			return {
				embeds: [
					new EmbedBuilder()
						.setColor('Yellow')
						.setTitle('⚠️ Partial update')
						.setDescription(
							`Updated database rank to **${rank}**, but failed to sync in-game LuckPerms group. Player may need to relog.`
						)
				],
				flags: ['Ephemeral']
			}
		}
	}

	log.msg(`Admin set ${user.displayName}'s rank to ${rank} (DB only — no MC UUID to sync LuckPerms)`)

	return {
		embeds: [
			new EmbedBuilder()
				.setColor('Yellow')
				.setTitle('⚠️ Database only')
				.setDescription(
					`Set ${user}'s rank to **${rank}**.\n⚠️ Player has no MC UUID linked, so in-game LuckPerms group could not be updated.`
				)
		],
		flags: ['Ephemeral']
	}
}
