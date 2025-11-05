import { logger } from 'robo.js'
import { db_bans, db_member, db_online_player, db_player, db_server, db_warns, player } from './types'
import { pool } from '../events/clientReady'
import user from './to be done/warn/user'

// ---------------- Players ----------------

export async function getProfileByDId(userId: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE user_id = ?', [userId])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching user profile by discord id: ${err}`)
		return null
	}
}

export async function getProfileByMcUuid(mcUuid: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE mc_uuid = ?', [mcUuid])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching user profile by mc_uuid: ${err}`)
		return null
	}
}

export async function getProfileByMcUsername(mcUsername: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE mc_username = ?', [mcUsername])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching user profile by mc_username: ${err}`)
		return null
	}
}

export async function getProfileByBedMcUsername(bedMcUsername: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE bed_mc_username = ?', [bedMcUsername])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching user profile by bed_mc_username: ${err}`)
		return null
	}
}

export async function getProfileByUeaEmail(email: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE uea_email = ?', [email])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching user profile by email: ${err}`)
		return null
	}
}

export async function createPlayerProfile(userId: string) {
	try {
		const result = await pool.query('INSERT INTO players (user_id) VALUES (?)', [userId])
		return { user_id: result.insertId.toString() } // minimal return
	} catch (err) {
		logger.error(`Error creating player profile: ${err}`)
		return null
	}
}

export async function updatePlayerProfile(did: string, new_playerP: db_player) {
	try {
		await pool.query(
			`UPDATE players
       SET uea_email = ?,
           mc_uuid = ?,
           mc_username = ?,
           mc_rank = ?
       WHERE user_id = ?`,
			[new_playerP.uea_email, new_playerP.mc_uuid, new_playerP.mc_username, new_playerP.mc_rank, did]
		)

		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE user_id = ?', [did])
		return rows[0] || null
	} catch (err) {
		logger.error(`Error updating player profile: ${err}`)
		return false
	}
}

// ---------------- Warnings ----------------

export async function createWarning(
	userId: string,
	issuer: string,
	reason: string,
	img: string[] = [],
	effectedUsers: string[] = [],
	warnEffectsBans: boolean = true
) {
	try {
		await pool.query(
			`INSERT INTO warns (user_id, issuer, reason, img, effected_users, warn_effects_bans)
       VALUES (?, ?, ?, ?, ?, ?)`,
			[userId, issuer, reason, JSON.stringify(img), JSON.stringify(effectedUsers), warnEffectsBans]
		)

		const rows = await pool.query<db_warns[]>(
			'SELECT * FROM warns WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
			[userId]
		)
		return rows[0] || null
	} catch (err) {
		logger.error(`Error creating warning: ${err}`)
		return null
	}
}

export async function getWarningsByUserId(userId: string) {
	try {
		return await pool.query<db_warns[]>('SELECT * FROM warns WHERE user_id = ? ORDER BY created_at DESC', [userId])
	} catch (err) {
		logger.error(`Error fetching warnings for user ${userId}: ${err}`)
		return []
	}
}

export async function deleteWarning(warnId: string) {
	try {
		await pool.query('DELETE FROM warns WHERE warn_id = ?', [warnId])
		return true
	} catch (err) {
		logger.error(`Error deleting warning ${warnId}: ${err}`)
		return false
	}
}

export async function getWarningsEffectBansByUserId(userId: string) {
	try {
		return await pool.query<db_warns[]>(
			`SELECT * FROM warns 
       WHERE user_id = ? AND warn_effects_bans = true 
       ORDER BY created_at DESC LIMIT 3`,
			[userId]
		)
	} catch (err) {
		logger.error(`Error fetching warnings for user ${userId}: ${err}`)
		return []
	}
}

export async function getWarningsByEffectedUser(effectedUserId: string) {
	try {
		return await pool.query<db_warns[]>(
			`SELECT * FROM warns
       WHERE JSON_CONTAINS(effected_users, ?)
       ORDER BY created_at DESC`,
			[`"${effectedUserId}"`] // JSON_CONTAINS needs JSON string value
		)
	} catch (err) {
		logger.error(`Error fetching warnings for effected user ${effectedUserId}: ${err}`)
		return []
	}
}

// ---------------- Bans ----------------

export async function createBan(userId: string, reason: string, bannedTill: number) {
	try {
		await pool.query('INSERT INTO bans (user_id, reason, banned_till) VALUES (?, ?, ?)', [userId, reason, bannedTill])

		const rows = await pool.query<db_bans[]>('SELECT * FROM bans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [
			userId
		])
		return rows[0] || null
	} catch (err) {
		logger.error(`Error creating ban: ${err}`)
		return null
	}
}

export async function getBansByUserId(userId: string) {
	try {
		return await pool.query<db_bans[]>('SELECT * FROM bans WHERE user_id = ? ORDER BY created_at DESC', [userId])
	} catch (err) {
		logger.error(`Error fetching bans for user ${userId}: ${err}`)
		return []
	}
}

export async function getBansExpiringToday() {
	try {
		const [rows] = await pool.query<db_bans[]>(
			`SELECT * 
       FROM bans
       WHERE DATE(DATE_ADD(created_at, INTERVAL banned_till MINUTE)) = CURDATE()
       ORDER BY created_at DESC`
		)

		return rows
	} catch (err) {
		logger.error(`Error fetching expiring bans: ${err}`)
		return []
	}
}

// ---------------- Maintenance ----------------

export async function expireOldWarnings() {
	try {
		await pool.query(
			`UPDATE warns
       SET warn_effects_bans = false
       WHERE warn_effects_bans = true
       AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)`
		)

		return await pool.query<db_warns[]>('SELECT * FROM warns WHERE warn_effects_bans = false ORDER BY created_at DESC')
	} catch (err) {
		logger.error(`Error expiring old warnings: ${err}`)
		return []
	}
}

// ---------------- Servers ----------------

export async function getServerByID(id: string) {
	try {
		const rows = await pool.query<db_server[]>('SELECT * FROM servers WHERE id = ?', [id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching servers by id: ${err}`)
		return null
	}
}

export async function getAllServers() {
	try {
		const rows = await pool.query<db_server[]>('SELECT * FROM servers WHERE online = true')
		return rows.length > 0 ? rows : null
	} catch (err) {
		logger.error(`Error fetching servers: ${err}`)
		return null
	}
}

export async function getAllServerNames() {
	try {
		const rows = await pool.query<{ name: string }[]>('SELECT id, name FROM servers')
		return rows.length > 0 ? rows : null
	} catch (err) {
		logger.error(`Error fetching server names: ${err}`)
		return null
	}
}

export async function createServer(id: string) {
	try {
		const result = await pool.query('INSERT INTO servers (id) VALUES (?)', [id])
		return { id: result.insertId.toString() }
	} catch (err) {
		logger.error(`Error creating player profile: ${err}`)
		return null
	}
}

export async function updateServer(id: string, newServer: db_server) {
	try {
		await pool.query(
			`UPDATE servers
       SET name = ?,
           emoji = ?,
           host = ?,
           game_port = ?,
           port = ?,
		   user = ?,
           pass = ?,
           currently_online = ?
       WHERE id = ?`,
			[
				newServer.name,
				newServer.emoji,
				newServer.host,
				newServer.game_port,
				newServer.port,
				newServer.user,
				newServer.pass,
				newServer.currently_online,
				id
			]
		)

		const rows = await pool.query<db_server[]>('SELECT * FROM servers WHERE id = ?', [id])
		return rows[0] || null
	} catch (err) {
		logger.error(`Error updating server profile: ${err}`)
		return false
	}
}

// ---------------- Online Players ----------------

export async function updateServerPlayers(id: string, players: player[]): Promise<boolean> {
	let conn

	try {
		conn = await pool.getConnection()
		await conn.beginTransaction()

		await conn.query(`UPDATE servers SET currently_online = ? WHERE id = ?`, [players.length, id])

		if (players.length > 0) {
			const uuids = players.map((p) => p.uuid)
			await conn.query(
				`DELETE FROM online_players
				 WHERE server = ?
				 AND uuid NOT IN (${uuids.map(() => '?').join(', ')})`,
				[id, ...uuids]
			)
		} else {
			await conn.query(`DELETE FROM online_players WHERE server = ?`, [id])
		}

		if (players.length > 0) {
			const placeholders = players.map(() => '(?, ?, ?, ?, ?, ?)').join(', ')
			const values = players.flatMap((p) => [p.uuid, p.name, p.level, p.health, p.gamemode, id])

			await conn.query(
				`INSERT INTO online_players (uuid, name, level, health, gamemode, server)
				 VALUES ${placeholders}
				 ON DUPLICATE KEY UPDATE
				 name = VALUES(name),
				 level = VALUES(level),
				 health = VALUES(health),
				 gamemode = VALUES(gamemode),
				 server = VALUES(server)`,
				values
			)
		}

		await conn.commit()
		return true
	} catch (err) {
		if (conn) await conn.rollback()
		logger?.error?.(`Error updating server players: ${err}`)
		return false
	} finally {
		if (conn) conn.release()
	}
}

export async function getPlayersByServer(id: string) {
	try {
		const rows = await pool.query<db_online_player[]>('SELECT * FROM online_players WHERE server = ?', [id])
		return rows.length > 0 ? rows : null
	} catch (err) {
		logger.error(`Error fetching servers by id: ${err}`)
		return null
	}
}

export async function getPlayersByName(name: string) {
	try {
		const rows = await pool.query<db_online_player[]>('SELECT * FROM online_players WHERE name = ?', [name])
		return rows.length > 0 ? rows[0] : false
	} catch (err) {
		logger.error(`Error fetching servers by id: ${err}`)
		return false
	}
}

export async function getAllPlayers(): Promise<db_online_player[]> {
	try {
		const rows = await pool.query<db_online_player[]>('SELECT * FROM online_players;')

		const result = Array.isArray(rows) ? rows : [rows]

		return result
	} catch (err) {
		logger.error(`Error fetching players: ${err}`)
		return []
	}
}

// ---------------- Servers ----------------

export async function getSettingByid(id: string) {
	try {
		const rows = await pool.query<any[]>('SELECT setting FROM guild_settings WHERE id = ?', [id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching servers by id: ${err}`)
		return null
	}
}

export async function updateSettings(id: string, setting: any) {
	try {
		await pool.query(
			`UPDATE guild_settings
       SET setting = ?
       WHERE id = ?`,
			[setting, id]
		)

		return true
	} catch (err) {
		logger.error(`Error updating server profile: ${err}`)
		return false
	}
}

// ---------------- Player Members ----------------

export async function getAllMembers(): Promise<db_member[]> {
	try {
		const rows = await pool.query<db_member[]>('SELECT * FROM player_members WHERE user_id IS NULL;')

		const result = Array.isArray(rows) ? rows : [rows]

		return result
	} catch (err) {
		logger.error(`Error fetching players: ${err}`)
		return []
	}
}

export async function getMemberId(uea_id: string) {
	try {
		const rows = await pool.query<db_member[]>('SELECT * FROM player_members WHERE id = ?', [uea_id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching member by id: ${err}`)
		return null
	}
}

export async function getMemberUserId(user_id: string) {
	try {
		const rows = await pool.query<db_member[]>('SELECT * FROM player_members WHERE user_id = ?', [user_id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		logger.error(`Error fetching member by id: ${err}`)
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
		logger.error(`Error updating server profile: ${err}`)
		return false
	}
}

export async function createMember(id: string) {
	try {
		await pool.query('INSERT INTO player_members (id) VALUES (?)', [id])
		return true
	} catch (err) {
		logger.error(`Error creating player profile: ${err}`)
		return null
	}
}

export async function createMembers(ids: string[]): Promise<boolean> {
	let conn

	try {
		conn = await pool.getConnection()
		await conn.beginTransaction()

		if (ids.length === 0) {
			await conn.query(`DELETE FROM player_members`)
			await conn.commit()
			return true
		}

		await conn.query(
			`DELETE FROM player_members
			 WHERE id NOT IN (${ids.map(() => '?').join(', ')})`,
			ids
		)

		const placeholders = ids.map(() => '(?)').join(', ')
		await conn.query(
			`INSERT INTO player_members (id)
			 VALUES ${placeholders}
			 ON DUPLICATE KEY UPDATE id = VALUES(id)`,
			ids
		)

		await conn.commit()
		return true
	} catch (err) {
		if (conn) await conn.rollback()
		logger?.error?.(`Error creating player members: ${err}`)
		return false
	} finally {
		if (conn) conn.release()
	}
}
