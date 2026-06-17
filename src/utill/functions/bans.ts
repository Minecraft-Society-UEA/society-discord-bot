import { online_server_check, mc_command, getWarningsEffectBansByUserId, createBan, db_warns, return_command } from '~/utill'

export async function mc_ban_player(mc_username: string, msg: string, mins: string): Promise<return_command> {
	const online = await online_server_check(mc_username)
	if (!online) return { success: false, message: 'Player is not currently online on any server' }

	try {
		const result = (await mc_command(online, `ban ${mc_username} ${mins} ${msg}`)) as return_command | null
		return result ?? { success: true, message: 'Command executed' }
	} catch (err) {
		return { success: false, message: `${err}` }
	}
}

export async function BAN(user_id: string, mc_username: string, reason: string, duationM: string) {
	const warnings = (await getWarningsEffectBansByUserId(user_id)) as db_warns[]

	const createdAt = new Date(warnings[warnings.length - 1].created_at)
	const expiryDate = new Date(createdAt)
	expiryDate.setFullYear(expiryDate.getFullYear() + 1)
	const diffMs = expiryDate.getTime() - Date.now()
	const mins_till_unban = Math.max(0, Math.floor(diffMs / (1000 * 60)))
	if (!warnings) {
		console.log(`cant ban user with no Warnings`)
		return false
	} else {
		await createBan(user_id, reason, mins_till_unban)
		const server = await mc_ban_player(mc_username, reason, `${mins_till_unban}m`)

		if (server.success) return true
	}
}

export function dateAfterMinutes(minutes: number): string {
	const target = new Date(Date.now() + minutes * 60000)

	const day = String(target.getDate()).padStart(2, '0')
	const month = String(target.getMonth() + 1).padStart(2, '0')
	const year = target.getFullYear()

	return `${day}/${month}/${year}`
}
