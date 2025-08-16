export type token = {
	token: string
}

export type player = {
	level: number
	name: string
	health: number
	uuid: string
	gamemode: string
}

export type connected_players = {
	max_players: number
	online_players: player[]
}

export type world = {
	name: string
	player_count: number
	time: number
	weather: string
}

export type server_info = {
	version: string
	bukkit_version: string
	server_name: string
	online_mode: boolean
	max_players: number
	current_players: number
	worlds: world[]
}

export type tokens = {
	hub: string
	survival: string
	creative: string
	event: string
}

export type mc_rank_type = 'unverified' | 'verified' | 'member' | 'admin'

export type db_player = {
	user_id: string
	uea_email: string
	mc_username: string
	mc_uuid: string
	mc_rank: mc_rank_type
	mc_verifid: boolean
	email_verifid: boolean
	is_member: boolean
	created_at: string
}

export type return_command = {
	success: boolean
	message: string
}
