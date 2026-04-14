import { logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { refreshOnlinePlayers, updatePlayersChannel } from '~/utill'

export default async () => {
	const scheduler2 = new ToadScheduler()

	async function refreshandchannle() {
		await refreshOnlinePlayers()
		updatePlayersChannel()
	}

	const task_update_players = new AsyncTask('update player message and channel', async () => {
		try {
			refreshOnlinePlayers()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshandchannle()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshOnlinePlayers()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshandchannle()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshOnlinePlayers()
			await new Promise((resolve) => setTimeout(resolve, 10000))
			refreshandchannle()
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	const job_update_players = new CronJob({ cronExpression: '*/1 * * * *' }, task_update_players, {
		preventOverrun: true
	})

	scheduler2.addCronJob(job_update_players)
}
