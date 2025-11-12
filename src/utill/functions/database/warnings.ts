import { db_warns, log } from '~/utill'
import { pool } from './pool'

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
		log.error(`Error creating warning: ${err}`)
		return null
	}
}

export async function getWarningsByUserId(userId: string) {
	try {
		return await pool.query<db_warns[]>('SELECT * FROM warns WHERE user_id = ? ORDER BY created_at DESC', [userId])
	} catch (err) {
		log.error(`Error fetching warnings for user ${userId}: ${err}`)
		return []
	}
}

export async function deleteWarning(warnId: string) {
	try {
		await pool.query('DELETE FROM warns WHERE warn_id = ?', [warnId])
		return true
	} catch (err) {
		log.error(`Error deleting warning ${warnId}: ${err}`)
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
		log.error(`Error fetching warnings for user ${userId}: ${err}`)
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
		log.error(`Error fetching warnings for effected user ${effectedUserId}: ${err}`)
		return []
	}
}
