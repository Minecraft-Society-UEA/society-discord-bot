import { logger } from 'robo.js'
import { AsyncTask, CronJob, ToadScheduler } from 'toad-scheduler'
import { annualMembershipReset } from '~/utill'

export default async () => {
	const scheduler = new ToadScheduler()

	const reset_task = new AsyncTask('annual membership reset', async () => {
		try {
			await annualMembershipReset()
		} catch (err) {
			logger.error(`Error in annual membership reset: ${err}`)
		}
	})

	// Fires at midnight on 31st July each year
	const reset_job = new CronJob({ cronExpression: '0 0 31 7 *' }, reset_task, { preventOverrun: true })

	scheduler.addCronJob(reset_job)
}
