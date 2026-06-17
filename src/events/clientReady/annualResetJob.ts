import { GuildMember, Role } from 'discord.js'
import { client, logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import {
	getAllLinkedMembers,
	clearAllMembers,
	getProfileByUeaEmail,
	updatePlayerProfile,
	mc_command,
	getSettingByid,
	log,
	role_settings,
	db_player,
	HUB_SERVER_ID
} from '~/utill'

export default async () => {
	const scheduler = new ToadScheduler()

	const reset_task = new AsyncTask(
		'annual membership reset',
		async () => {
			try {
				await annualMembershipReset()
			} catch (err) {
				logger.error(`Error in annual membership reset: ${err}`)
			}
		}
	)

	// Fires at midnight on 31st July each year
	const reset_job = new CronJob({ cronExpression: '0 0 31 7 *' }, reset_task, { preventOverrun: true })

	scheduler.addCronJob(reset_job)
}

export async function annualMembershipReset() {
	const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
	if (!guild || !guild.members.me) {
		log.error('Annual reset: guild not found')
		return
	}

	const roles = (await getSettingByid('roles')) as role_settings
	const linked_members = await getAllLinkedMembers()

	log.info(`Annual reset: processing ${linked_members.length} linked members`)

	for (const entry of linked_members) {
		if (!entry.user_id) continue

		try {
			const profile = (await getProfileByUeaEmail(entry.id)) as db_player | null
			if (!profile) continue

			// Demote in LuckPerms
			if (profile.mc_uuid) {
				await mc_command(HUB_SERVER_ID, `lp user ${profile.mc_uuid} parent set verified`).catch((err) =>
					log.warn(`Annual reset: LP rank reset failed for ${profile.mc_username}: ${err}`)
				)
			}

			// Update DB rank
			profile.mc_rank = 'verified'
			await updatePlayerProfile(profile.user_id, profile)

			// Remove Discord member role
			const discord_member = await guild.members.fetch(profile.user_id).catch(() => null) as GuildMember | null
			if (
				discord_member &&
				guild.members.me!.roles.highest.comparePositionTo(discord_member.roles.highest) > 0 &&
				discord_member.id !== guild.ownerId
			) {
				await discord_member.roles.remove(guild.roles.cache.get(roles.setting.member) as Role)
			}

			log.msg(`Annual reset: removed member status from ${profile.mc_username ?? entry.user_id}`)
		} catch (err) {
			log.error(`Annual reset: failed to process entry ${entry.id}: ${err}`)
		}
	}

	await clearAllMembers()

	log.info('Annual membership reset complete — player_members table cleared, all member roles removed')
}
