// type of player warnings in the db
export type db_warns = {
	warn_id: string
	user_id: string
	issuer: string
	reason: string
	img?: string[]
	effected_users?: string[]
	warn_effects_bans: boolean
	created_at: string
}

// type of player mc bans in db
export type db_bans = {
	ban_id: string
	user_id: string
	reason: string
	banned_till: number
	created_at: string
}
