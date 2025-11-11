// database type for storing and getting the currently online players
export type db_online_player = {
	uuid: string
	name: string
	level: number
	health: number
	gamemode: string
	server: string
}
