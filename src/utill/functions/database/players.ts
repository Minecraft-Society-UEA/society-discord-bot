import { db_player, log } from '~/utill'
import { pool } from './pool'

export async function getProfileByDId(userId: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE user_id = ?', [userId])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching user profile by discord id: ${err}`)
		return null
	}
}

export async function getProfileByMcUuid(mcUuid: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE mc_uuid = ?', [mcUuid])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching user profile by mc_uuid: ${err}`)
		return null
	}
}

export async function getProfileByMcUsername(mcUsername: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE mc_username = ?', [mcUsername])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching user profile by mc_username: ${err}`)
		return null
	}
}

export async function getProfileByBedMcUsername(bedMcUsername: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE bed_mc_username = ?', [bedMcUsername])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching user profile by bed_mc_username: ${err}`)
		return null
	}
}

export async function getProfileByUeaEmail(email: string) {
	try {
		const rows = await pool.query<db_player[]>('SELECT * FROM players WHERE uea_email = ?', [email])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching user profile by email: ${err}`)
		return null
	}
}

export async function createPlayerProfile(userId: string) {
	try {
		const result = await pool.query('INSERT INTO players (user_id) VALUES (?)', [userId])
		return { user_id: result.insertId.toString() } // minimal return
	} catch (err) {
		log.error(`Error creating player profile: ${err}`)
		return null
	}
}

export async function deletePlayerProfile(userId: string) {
	try {
		await pool.query('DELETE FROM players WHERE user_id = ?', [userId])
		return true
	} catch (err) {
		log.error(`Error deleting player profile: ${err}`)
		return false
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
		log.error(`Error updating player profile: ${err}`)
		return false
	}
}
