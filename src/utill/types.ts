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
