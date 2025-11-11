import { pool } from '~/events/clientReady'
import { log } from '~/utill'

export async function getSettingByid(id: string) {
	try {
		const rows = await pool.query<any[]>('SELECT setting FROM guild_settings WHERE id = ?', [id])
		return rows.length > 0 ? rows[0] : null
	} catch (err) {
		log.error(`Error fetching servers by id: ${err}`)
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
		log.error(`Error updating server profile: ${err}`)
		return false
	}
}
