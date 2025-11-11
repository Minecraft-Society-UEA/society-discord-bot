import { pool } from '~/events/clientReady'
import { db_server, log } from '~/utill'

export async function getServerByID(id: string) {
	try {
		const rows = await pool.query<db_server[]>('SELECT * FROM servers WHERE id = ?', [id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching servers by id: ${err}`)
		return null
	}
}

export async function getAllServers() {
	try {
		const rows = await pool.query<db_server[]>('SELECT * FROM servers WHERE online = true')
		return rows.length > 0 ? rows : null
	} catch (err) {
		log.error(`Error fetching servers: ${err}`)
		return null
	}
}

export async function getAllServerNames() {
	try {
		const rows = await pool.query<{ name: string }[]>('SELECT id, name FROM servers')
		return rows.length > 0 ? rows : null
	} catch (err) {
		log.error(`Error fetching server names: ${err}`)
		return null
	}
}

export async function createServer(id: string) {
	try {
		const result = await pool.query('INSERT INTO servers (id) VALUES (?)', [id])
		return { id: result.insertId.toString() }
	} catch (err) {
		log.error(`Error creating player profile: ${err}`)
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
		log.error(`Error updating server profile: ${err}`)
		return false
	}
}
