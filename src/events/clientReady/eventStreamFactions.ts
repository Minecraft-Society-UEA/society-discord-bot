import { getServerByID } from '~/utill'

export default async () => {
	const server = await getServerByID('bd04a936-7b51-43c2-a6b6-6274c2a55224')
	const eventSource = new EventSource(
		process.env.FACTIONS_TESTING + '/api/events/stream?auth=' + process.env.FACTIONS_PASS
	)

	eventSource.addEventListener('chat', (event) => {
		const data = JSON.parse(event.data)
		console.log(`${data.player}: ${data.content}`)
	})

	eventSource.addEventListener('death', (event) => {
		const data = JSON.parse(event.data)
		console.log(data.content)
	})
}
