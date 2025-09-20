import { GuildMember, Role } from 'discord.js'
import { Flashcore } from 'robo.js'
import { role_storage } from '~/utill/types'

export default async (member: GuildMember) => {
	const roles = (await Flashcore.get(`mc_role_id`)) as role_storage
	const role = (await member.guild.roles.cache.get(roles.unverified)) as Role

	await member.roles.add(role)
}
