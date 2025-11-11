import { getServerByID, server_token_resolver, online_server_check, db_server } from '~/utill'

export async function mc_command(id: string, command: string) {
	const details = (await getServerByID(id)) as db_server
	const body_command = {
		command: command
	}

	const res = await fetch(`${details.host}:${details.port}/api/server/command`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_token_resolver(details.id)}`
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

export async function message_player(mc_username: string, msg: string) {
	const online = await online_server_check(mc_username)
	if (!online) return false
	const server = (await getServerByID(online)) as db_server
	const body_message = {
		player: mc_username,
		message: msg
	}

	if (!server) return false

	const response = await fetch(`${server.host}:${server.port}/api/player/message`, {
		method: 'post',
		headers: {
			Authorization: `Bearer ${server_token_resolver(server.id)}`
		},
		body: JSON.stringify(body_message)
	})

	return true
}
