import {
	db_member,
	db_player,
	getProfileByUeaEmail,
	getSettingByid,
	log,
	mc_command,
	role_settings,
	updatePlayerProfile
} from '~/utill'
import { pool } from './pool'
import { client } from 'robo.js'
import { GuildMember, Role } from 'discord.js'

export async function getAllMembers(): Promise<db_member[]> {
	try {
		const rows = await pool.query<db_member[]>('SELECT * FROM player_members WHERE user_id IS NULL;')

		const result = Array.isArray(rows) ? rows : [rows]

		return result
	} catch (err) {
		log.error(`Error fetching players: ${err}`)
		return []
	}
}

export async function getMemberId(uea_id: string) {
	try {
		const rows = await pool.query<db_member[]>('SELECT * FROM player_members WHERE id = ?', [uea_id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching member by id: ${err}`)
		return null
	}
}

export async function getMemberUserId(user_id: string) {
	try {
		const rows = await pool.query<db_member[]>('SELECT * FROM player_members WHERE user_id = ?', [user_id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching member by id: ${err}`)
		return null
	}
}

export async function updateMember(id: string, user_id: any) {
	try {
		await pool.query(
			`UPDATE player_members
       SET user_id = ?
       WHERE id = ?`,
			[user_id, id]
		)

		return true
	} catch (err) {
		log.error(`Error updating server profile: ${err}`)
		return false
	}
}

export async function createMember(id: string) {
	try {
		await pool.query('INSERT INTO player_members (id) VALUES (?)', [id])
		return true
	} catch (err) {
		log.error(`Error creating player profile: ${err}`)
		return null
	}
}

export async function createMembers(ids: string[]): Promise<boolean> {
	let conn

	try {
		conn = await pool.getConnection()
		await conn.beginTransaction()

		// Force rows to always be treated as an array
		const rawRows = await conn.query(`SELECT id FROM player_members;`)
		const rows = Array.isArray(rawRows) ? rawRows : [rawRows]
		const existingIds = rows.map((r: any) => r.id)

		const toRemove = existingIds.filter((id) => !ids.includes(id))
		const toAdd = ids.filter((id) => !existingIds.includes(id))

		for (const id of toRemove) {
			await membershipRevoked(id)
		}

		if (toRemove.length > 0) {
			const placeholders = toRemove.map(() => '?').join(', ')
			await conn.query(`DELETE FROM player_members WHERE id IN (${placeholders})`, toRemove)
		}

		if (toAdd.length > 0) {
			const placeholders = toAdd.map(() => '(?)').join(', ')
			await conn.query(`INSERT INTO player_members (id) VALUES ${placeholders}`, toAdd)
		}

		await conn.commit()
		return true
	} catch (err) {
		if (conn) await conn.rollback()
		log?.error?.(`Error creating player members: ${err}`)
		return false
	} finally {
		if (conn) conn.release()
	}
}

async function membershipRevoked(id: string) {
	const profile = (await getProfileByUeaEmail(id)) as db_player
	if (!profile) return
	const guild = client.guilds.cache.get(process.env.DISCORD_GUILD_ID)
	if (!guild || !guild.members.me) return console.error(`Guild not found`)

	await mc_command(`a406fbb6-418d-4160-8611-1c180d33da14`, `lp user ${profile.mc_uuid} demote player`)

	profile.mc_rank = `verified`

	await updatePlayerProfile(profile.user_id, profile)

	log.msg(`profile: ${profile.mc_username} has lost there member status`)

	const roles = (await getSettingByid(`roles`)) as role_settings
	const member_roles = (await guild.members.fetch(profile.user_id)) as GuildMember

	if (
		guild.members.me.roles.highest.comparePositionTo(member_roles.roles.highest) > 0 &&
		member_roles.id !== guild.ownerId
	) {
		await member_roles.roles.remove((await guild.roles.cache.get(roles.setting.member)) as Role)
	}
}
