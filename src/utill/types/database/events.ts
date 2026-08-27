// type of a society event in the db
export type db_event = {
	event_id: string
	name: string
	description: string | null
	location_type: 'server' | 'in_person'
	location: string | null
	max_capacity: number | null
	start_time: string
	created_by: string
	reminded_7d: boolean
	reminded_12h: boolean
	status: 'scheduled' | 'cancelled' | 'completed'
	created_at: string
}

// type of a sign up to an event in the db
export type db_event_signup = {
	event_id: string
	user_id: string
	status: 'confirmed' | 'waitlist'
	signed_up_at: string
}
