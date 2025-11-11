// the type of the worlds array the server info returns
export type world = {
	name: string
	player_count: number
	time: number
	weather: string
}

//the type /server/info returns
export type server_info = {
	version: string
	bukkit_version: string
	server_name: string
	online_mode: boolean
	max_players: number
	current_players: number
	worlds: world[]
}
