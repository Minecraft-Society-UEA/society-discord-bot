import { EmbedBuilder } from 'discord.js'
import { createCommandConfig } from 'robo.js'
import type { ChatInputCommandInteraction } from 'discord.js'
import type { CommandOptions, CommandResult } from 'robo.js'

export const config = createCommandConfig({
	description: 'List available commands grouped by category',
	contexts: ['Guild'],
	integrationTypes: ['GuildInstall'],
	options: [
		{
			name: 'ephemeral',
			description: 'whether the reply should only be visible to you (default: true)',
			type: 'boolean',
			required: false
		}
	]
} as const)

export default async (interaction: ChatInputCommandInteraction, options: CommandOptions<typeof config>): Promise<CommandResult> => {
	const ephemeral = options.ephemeral ?? true
	const embed = new EmbedBuilder()
		.setTitle('✦ UEA MC Society — Commands')
		.setColor([136, 61, 255])
		.addFields(
			{
				name: '🔗 Verification',
				value: [
					'`/verify mc` — Link your Minecraft account',
					'`/verify email` — Link your UEA email',
					'`/verify member` — Verify your society membership'
				].join('\n'),
				inline: false
			},
			{
				name: '👤 Your Account',
				value: [
					'`/profile` — View your linked profile',
					'`/unlink mc` — Remove MC link',
					'`/unlink email` — Remove email link',
					'`/unlink remove-all-data` — Delete all your data'
				].join('\n'),
				inline: false
			},
			{
				name: '🌐 Server Info',
				value: [
					'`/online` — See who is online across all servers',
					'`/mc-stats` — Check a player\'s current MC status',
					'`/leaderboard` — Top players by playtime or messages this season',
					'`/conection-info` — Java, Bedrock, and PS4/5 connection details',
					'`/ping` — Bot latency and database status'
				].join('\n'),
				inline: false
			},
			{
				name: '⚔️ Factions',
				value: [
					'`/faction` — Find your faction thread',
					'`/factions` — List all active factions'
				].join('\n'),
				inline: false
			},
			{
				name: '🎉 Social',
				value: [
					'`/intro` — Post an introduction',
					'`/feedback` — Send anonymous feedback to the committee'
				].join('\n'),
				inline: false
			},
			{
				name: '🛡️ Admin (Committee Only)',
				value: [
					'`/admin/lookup` — Find a player profile',
					'`/admin/profile` — View a user\'s profile',
					'`/admin/set-rank` — Directly set a player\'s rank',
					'`/admin/kick` — Kick a player from MC',
					'`/admin/sync-members` — Manual membership sync',
					'`/admin/export-members` — Export linked members as CSV',
					'`/admin/reset-annual` — Trigger annual membership reset',
					'`/admin/server-status` — All server reachability',
					'`/admin/server command` — Run a MC console command',
					'`/admin/server start` — Start a server',
					'`/admin/server restart` — Restart a server',
					'`/admin/server stop` — Stop a server',
					'`/admin/server list` — List all servers and online counts',
					'`/admin/add-plus-1` — Give someone a plus-1',
					'`/admin/remove-plus1` — Remove a plus-1',
					'`/admin/plus1-list` — List active plus-1s',
					'`/admin/force-link/mc` — Force-link a MC account',
					'`/admin/force-link/email` — Force-link a UEA email',
					'`/admin/settings` — Configure guild settings'
				].join('\n'),
				inline: false
			}
		)
		.setFooter({ text: 'Use /verify mc to get started if you\'re new!' })

	return { embeds: [embed], flags: ephemeral ? ['Ephemeral'] : undefined }
}
