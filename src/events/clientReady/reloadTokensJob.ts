import { logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { loadTokens } from '~/utill'

export default async () => {
	const scheduler1 = new ToadScheduler()

	const task_load_tokens = new AsyncTask('fetch tokens', async () => {
		try {
			await loadTokens()
		} catch (error) {
			logger.error(`Error in task execution:\n${error}`)
		}
	})

	const job_load_tokens = new CronJob({ cronExpression: '0 */6 * * *' }, task_load_tokens, { preventOverrun: true })

	scheduler1.addCronJob(job_load_tokens)
}
