// playtime/message tracking, scoped per SMP season (resets at annual membership reset)
export type db_season_stats = {
	user_id: string
	season: string
	playtime_seconds: number
	messages_sent: number
}
