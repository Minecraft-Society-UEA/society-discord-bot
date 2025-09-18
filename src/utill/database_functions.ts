import { logger } from 'robo.js'
import { db_bans, db_player, db_warns } from './types'
import { pool } from '../events/clientReady'

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
           mc_rank = ?,
           is_member = ?
       WHERE user_id = ?`,
			[
				new_playerP.uea_email,
				new_playerP.mc_uuid,
				new_playerP.mc_username,
				new_playerP.mc_rank,
				new_playerP.is_member ?? false,
				did
			]
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
