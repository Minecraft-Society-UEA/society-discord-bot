const ptero_headers = () => {
	const url = process.env.PTERODACTYL_URL
	const key = process.env.PTERODACTYL_KEY
	if (!url || !key) throw new Error('Missing PTERODACTYL_URL or PTERODACTYL_KEY env vars')
	return { url, headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' } }
}

// Runs a console command on the Velocity proxy via Pterodactyl (used for LibertyBans ban/unban)
export async function pterodactyl_command(command: string): Promise<boolean> {
	const velocity_id = process.env.PTERODACTYL_VELOCITY_ID
	if (!velocity_id) throw new Error('Missing PTERODACTYL_VELOCITY_ID env var')

	const { url, headers } = ptero_headers()

	const res = await fetch(`${url}/api/client/servers/${velocity_id}/command`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ command })
	})

	if (!res.ok) {
		const text = await res.text()
		throw new Error(`Pterodactyl command failed (${res.status}): ${text}`)
	}

	return true
}

// Sends a power action to any server using its Pterodactyl UUID from the servers table
export async function pterodactyl_power(
	server_uuid: string,
	action: 'start' | 'stop' | 'restart' | 'kill'
): Promise<boolean> {
	const { url, headers } = ptero_headers()

	const res = await fetch(`${url}/api/client/servers/${server_uuid}/power`, {
		method: 'POST',
		headers,
		body: JSON.stringify({ signal: action })
	})

	if (!res.ok) {
		const text = await res.text()
		throw new Error(`Pterodactyl power action failed (${res.status}): ${text}`)
	}

	return true
}

// Parses a LibertyBans duration string (e.g. "5d", "24h", "30m", "1mo") to minutes for DB storage.
// Returns 0 for permanent bans.
export function parseLibertyBansDuration(duration: string): number {
	const match = duration.trim().match(/^(\d+)(m|h|d|mo)$/)
	if (!match) return 0
	const n = parseInt(match[1])
	switch (match[2]) {
		case 'm': return n
		case 'h': return n * 60
		case 'd': return n * 60 * 24
		case 'mo': return n * 60 * 24 * 30
		default: return 0
	}
}
