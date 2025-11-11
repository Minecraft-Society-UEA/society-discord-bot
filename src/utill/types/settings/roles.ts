// roles being stored
export type role_storage = {
	mc_verified: string
	email_verified: string
	member: string
	tester: string
	unverified: string
	committee: string
}

// settings from db type
export type role_settings = {
	setting: role_storage
}
