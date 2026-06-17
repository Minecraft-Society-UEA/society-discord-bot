import { log } from '~/utill'
import { pool } from './pool'

export type db_faction = {
	id: string
	faction_name: string
	channel_id: string
	thread_id: string
	thread_name: string
}

export async function getAllFactions(): Promise<db_faction[]> {
	try {
		const rows = await pool.query<db_faction[]>('SELECT * FROM factions')
		return Array.isArray(rows) ? rows : [rows]
	} catch (err) {
		log.error(`Error fetching factions: ${err}`)
		return []
	}
}

export async function getFactionById(id: string): Promise<db_faction | null> {
	try {
		const rows = await pool.query<db_faction[]>('SELECT * FROM factions WHERE id = ?', [id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching faction by id: ${err}`)
		return null
	}
}

export async function createFaction(id: string, faction_name: string, channel_id: string, thread_id: string, thread_name: string): Promise<boolean> {
	try {
		await pool.query(
			'INSERT INTO factions (id, faction_name, channel_id, thread_id, thread_name) VALUES (?, ?, ?, ?, ?)',
			[id, faction_name, channel_id, thread_id, thread_name]
		)
		return true
	} catch (err) {
		log.error(`Error creating faction: ${err}`)
		return false
	}
}

export async function deleteFaction(id: string): Promise<boolean> {
	try {
		await pool.query('DELETE FROM factions WHERE id = ?', [id])
		return true
	} catch (err) {
		log.error(`Error deleting faction: ${err}`)
		return false
	}
}
