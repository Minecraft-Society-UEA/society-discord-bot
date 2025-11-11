import { pool } from '~/events/clientReady'
import { log } from '~/utill'
import { db_member } from '~/utill/types'

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
		log?.error?.(`Error creating player members: ${err}`)
		return false
	} finally {
		if (conn) conn.release()
	}
}
