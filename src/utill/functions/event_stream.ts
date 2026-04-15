import { getState, setState } from 'robo.js'
import { event } from '~/utill'

export function eventTimestampCheck(event: event) {
	const lastEvent = getState<string>(event.type + `_` + event.player + `_lastEvent`) ?? ''
	if (lastEvent && event.timestamp === lastEvent) {
		return false
	}

	setState<string>(event.type + `_` + event.player + `_lastEvent`, event.timestamp)
	return true
}
