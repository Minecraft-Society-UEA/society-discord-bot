import { getServerByID, server_auth_header, online_server_check, db_server } from '~/utill'

// paper exposes console commands at /api/server/command, fabric at /api/command
export async function mc_command(id: string, command: string) {
	const details = (await getServerByID(id)) as db_server
	const body_command = {
		command: command
	}

	const endpoint = details.type === 'fabric' ? `${details.host}/api/command` : `${details.host}/api/server/command`

	const res = await fetch(endpoint, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_auth_header(details)}`
		},
		body: JSON.stringify(body_command)
	})
	if (!res.ok) {
		throw new Error(`mc_command failed with status ${res.status}: ${await res.text()}`)
	}

	const text = await res.text()
	if (!text) return null

	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

// paper has a dedicated /api/player/message whisper endpoint; fabric has no equivalent
// so we send the message via its generic command endpoint instead
export async function sendPlayerMessage(server: db_server, mc_username: string, msg: string): Promise<boolean> {
	if (server.type === 'fabric') {
		await mc_command(server.id, `tell ${mc_username} ${msg}`)
		return true
	}

	const response = await fetch(`${server.host}/api/player/message`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_auth_header(server)}`
		},
		body: JSON.stringify({ player: mc_username, message: msg })
	})

	return response.ok
}

export async function message_player(mc_username: string, msg: string) {
	const online = await online_server_check(mc_username)
	if (!online) return false
	const server = (await getServerByID(online)) as db_server
	if (!server) return false

	return sendPlayerMessage(server, mc_username, msg)
}
