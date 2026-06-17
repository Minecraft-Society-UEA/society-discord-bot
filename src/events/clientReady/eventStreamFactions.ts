import { EventSource } from 'eventsource'
import {
	claim,
	db_server,
	event,
	eventTimestampCheck,
	faction_chat,
	faction_member_join,
	faction_member_leave,
	getServersByType,
	global_chat,
	log
} from '~/utill'

function connectFactionEventStream(server: db_server) {
	const source = `${server.host}/api/events/stream?_auth=${server.pass}`
	const eventSource = new EventSource(source)

	eventSource.onopen = () => console.log(`[EventSource] Connection opened for ${server.name}:`, source.slice(0, 25) + '...')
	eventSource.onerror = (err) => console.error(`[EventSource] Error on ${server.name}:`, err)

	// TODO: relay global chat to a Discord channel
	eventSource.addEventListener('global.chat', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
		const content = JSON.parse(data.content) as global_chat
	})

	// TODO: relay faction chat to the faction's Discord thread (see factions table)
	eventSource.addEventListener('faction.chat', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
		const content = JSON.parse(data.content) as faction_chat
	})

	// TODO: announce member joins in the faction's Discord thread
	eventSource.addEventListener('faction.member_join', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
		const content = JSON.parse(data.content) as faction_member_join
	})

	// TODO: announce member leaves in the faction's Discord thread
	eventSource.addEventListener('faction.member_leave', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
		const content = JSON.parse(data.content) as faction_member_leave
	})

	// TODO: update online player count / status
	eventSource.addEventListener('join', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
	})

	// TODO: update online player count / status
	eventSource.addEventListener('leave', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
	})

	// TODO: post claim changes to faction thread
	eventSource.addEventListener('claim.added', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
		console.log(data)
		const content = JSON.parse(data.content) as claim
	})

	// TODO: post claim changes to faction thread
	eventSource.addEventListener('claim.removed', (event) => {
		const data = JSON.parse(event.data) as event
		if (!eventTimestampCheck(data)) return
		console.log(data)
		const content = JSON.parse(data.content) as claim
	})
}

export default async () => {
	const servers = await getServersByType('fabric')

	if (!servers) {
		log.error('No fabric servers found in DB — skipping faction event stream connection')
		return
	}

	for (const server of servers) {
		connectFactionEventStream(server)
	}
}
