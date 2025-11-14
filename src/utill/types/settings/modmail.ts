export type modmailProperties = {
	title: string
	description?: string
	footer: string
}

export type modmailSettings = {
	setting: {
		customMsg: modmailProperties
		introMsg: modmailProperties
	}
}

export type ModMailUserData = {
	threadId: string
	userId: string
}
