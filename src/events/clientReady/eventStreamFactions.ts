import { EventSource } from 'eventsource'
import { getServerByID } from '~/utill'

export default async () => {
	const server = await getServerByID('bd04a936-7b51-43c2-a6b6-6274c2a55224')
	const source = (await ((await process.env.FACTIONS_TESTING) +
		'/api/events/stream?_auth=mcsapi_ca08abbabce0598425c9950255ff932d65e0054438263b85')) as string
	console.log('Connecting to event stream at:', source)
	const eventSource = new EventSource(source)

	eventSource.onopen = () => console.log('[EventSource] Connection opened:', source)
	eventSource.onerror = (err) => console.error('[EventSource] Error:', err)

	eventSource.addEventListener('global.chat', (event: Event) => {
		const data = JSON.parse((event as MessageEvent).data)
		console.log(data)
	})

	eventSource.addEventListener('faction.chat', (event: Event) => {
		const data = JSON.parse((event as MessageEvent).data)
		console.log(data)
	})

	eventSource.addEventListener('faction.member_join', (event) => {
		const data = JSON.parse(event.data)
		console.log(data)
	})

	eventSource.addEventListener('faction.member_leave', (event) => {
		const data = JSON.parse(event.data)
		console.log(data)
	})

	eventSource.addEventListener('claim.added', (event) => {
		const data = JSON.parse(event.data)
		console.log(data)
	})

	eventSource.addEventListener('join', (event) => {
		const data = JSON.parse(event.data)
		console.log(data)
	})

	eventSource.addEventListener('leave', (event) => {
		const data = JSON.parse(event.data)
		console.log(data)
	})
}
