import { pool } from '~/events/clientReady'
import { log, db_bans } from '~/utill'

export async function createBan(userId: string, reason: string, bannedTill: number) {
	try {
		await pool.query('INSERT INTO bans (user_id, reason, banned_till) VALUES (?, ?, ?)', [userId, reason, bannedTill])

		const rows = await pool.query<db_bans[]>('SELECT * FROM bans WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [
			userId
		])
		return rows[0] || null
	} catch (err) {
		log.error(`Error creating ban: ${err}`)
		return null
	}
}

export async function getBansByUserId(userId: string) {
	try {
		return await pool.query<db_bans[]>('SELECT * FROM bans WHERE user_id = ? ORDER BY created_at DESC', [userId])
	} catch (err) {
		log.error(`Error fetching bans for user ${userId}: ${err}`)
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
		log.error(`Error fetching expiring bans: ${err}`)
		return []
	}
}
