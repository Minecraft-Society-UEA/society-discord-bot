import { logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { resetPlayersMessage } from '~/utill'

export default async () => {
	// create a cron job to go off on every 12th hour t oreload the tokens with fresh ones

	const scheduler3 = new ToadScheduler()

	const task_2h = new AsyncTask('misc tasks 2h', async () => {
		try {
			await resetPlayersMessage()
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	const job_2h = new CronJob({ cronExpression: '0 */2 * * *' }, task_2h, {
		preventOverrun: true
	})

	scheduler3.addCronJob(job_2h)
}
