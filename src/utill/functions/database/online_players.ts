import { db_online_player, log, player } from '~/utill'
import { pool } from './pool'

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
		log.error(`Error updating server players: ${err}`)
		return false
	} finally {
		if (conn) conn.release()
	}
}

export async function getPlayersByServer(serverId: string) {
	try {
		const rows = await pool.query<db_online_player[]>('SELECT * FROM online_players WHERE server = ?', [serverId])
		return rows.length > 0 ? rows : null
	} catch (err) {
		log.error(`Error fetching servers by id: ${err}`)
		return null
	}
}

export async function getPlayersByName(name: string) {
	try {
		const rows = await pool.query<db_online_player[]>('SELECT * FROM online_players WHERE name = ?', [name])
		return rows.length > 0 ? rows[0] : false
	} catch (err) {
		log.error(`Error fetching servers by id: ${err}`)
		return false
	}
}

export async function getAllPlayers(): Promise<db_online_player[]> {
	try {
		const rows = await pool.query<db_online_player[]>('SELECT * FROM online_players;')

		const result = Array.isArray(rows) ? rows : [rows]

		return result
	} catch (err) {
		log.error(`Error fetching players: ${err}`)
		return []
	}
}
