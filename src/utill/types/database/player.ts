// mc rank type or what ranks a player can be
export type mc_rank_type = 'unverified' | 'verified' | 'member' | 'tester' | 'admin'

//the type of the player profiles stored in the Databaseastari
export type db_player = {
	user_id: string
	uea_email: string | null
	mc_username: string | null
	bed_mc_username: string | null
	mc_uuid: string | null
	mc_rank: mc_rank_type
	created_at: string
}

// type for member status storage
export type db_member = {
	id: string
	user_id: string
}
