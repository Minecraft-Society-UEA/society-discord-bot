import { getState, setState } from 'robo.js'
import { getAllServers, log } from '~/utill'
import { db_server, token } from '~/utill/types'

// resolve the token for a server
export function server_token_resolver(id: string): string | null {
	return getState<string>(`${id}_token`)
}

//function to get and save all tokens for each server
export async function loadTokens() {
	const servers = (await getAllServers()) as db_server[]
	for (const server of servers) {
		try {
			const body = { username: server.user, password: server.pass }
			const res = await fetch(`${server.host}:${server.port}/api/auth/login`, {
				method: 'POST',
				body: JSON.stringify(body)
			})

			if (!res.ok) {
				log.error(`Error logging in to ${server.name}.`)
				continue
			}

			const data = (await res.json()) as token
			await setState(`${server.id}_token`, data.token)
		} catch (err) {
			log.error(`Error loading token for ${server}: \n${err}`)
		}
	}

	log.info(`Logged in to all servers and stored tokens`)
}
