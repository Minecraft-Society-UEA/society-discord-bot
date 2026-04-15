export type event = {
	type: string
	player: string
	content: any // any typing is ok here as the content will vary greatly between events and can be parsed as needed in the event handlers
	timestamp: string
}
