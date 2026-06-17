import { EventSource } from 'eventsource'
import {
	claim,
	event,
	eventTimestampCheck,
	faction_chat,
	faction_member_join,
	faction_member_leave,
	getServerByID,
	global_chat
} from '~/utill'

export default async () => {
	const server = await getServerByID('bd04a936-7b51-43c2-a6b6-6274c2a55224')
	const source = (await ((await process.env.FACTIONS_TESTING) +
		'/api/events/stream?_auth=mcsapi_ca08abbabce0598425c9950255ff932d65e0054438263b85')) as string
	const eventSource = new EventSource(source)

	eventSource.onopen = () => console.log('[EventSource] Connection opened:', source.slice(0, 25) + '...')
	eventSource.onerror = (err) => console.error('[EventSource] Error:', err)

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
