import { player } from '~/utill/types'

// type for servers in the db
export type db_server = {
	id: string
	name: string
	emoji: string
	host: string
	game_port: string
	port: string
	user: string
	pass: string
	currently_online: number
	players: player[]
}
