import { AttachmentBuilder, EmbedBuilder, GuildMember, HexColorString, Role } from 'discord.js'
import path from 'path'
import { Flashcore } from 'robo.js'
import sharp from 'sharp'
import { guild_settings, role_storage } from '~/utill/types'

export default async (member: GuildMember) => {
	const roles = (await Flashcore.get(`mc_role_id`)) as role_storage
	const role = (await member.guild.roles.cache.get(roles.unverified)) as Role

	await member.roles.add(role)

	const settings = await Flashcore.get<guild_settings>(`guild_settings-${member.guild.id}`)
	const embed = new EmbedBuilder()
	const guild = member.guild
	const channel = guild?.channels.cache.get(`${settings.welcome_msg.channelid}`)
	const path = convertPath(settings.welcome_msg.path)
	const file = (await image_process(
		settings.welcome_msg.colourhex,
		member.user.displayAvatarURL(),
		path
	)) as AttachmentBuilder

	if (!channel || !channel.isTextBased()) {
		console.error('Channel not found or is not a text channel')
		return
	}

	embed
		.setTitle(settings.welcome_msg.title)
		.setDescription(settings.welcome_msg.description)
		.setColor(settings.welcome_msg.colourhex)
		.setTimestamp()
		.setImage(`attachment://done-${member.user.displayAvatarURL()}.png`)

	await channel.send({ content: `${member}`, embeds: [embed], files: [file] })
	return
}

export const convertPath = (configPath: string) => {
	const segments = configPath.split(/[\\/]/)

	const templatePath = path.join(process.cwd(), ...segments)

	return templatePath
}

export async function image_process(hexcolor: HexColorString, avatarUrl: string, path: any) {
	const avatarurl = avatarUrl
	const response = await fetch(avatarurl)
	if (!response.ok) {
		throw new Error(`Failed to fetch image: ${response.statusText}`)
	}

	const arrayBuffer = await response.arrayBuffer()
	const imageBuffer = Buffer.from(arrayBuffer)

	const templatePath = path

	const circleMask = Buffer.from(`<svg><circle cx="100" cy="100" r="100" /></svg>`)
	const borderColor = hexcolor
	const borderMask = Buffer.from(
		`<svg width="210" height="210"><circle cx="105" cy="105" r="105" fill="${borderColor}" /></svg>`
	)

	const profileImage = await sharp(imageBuffer)
		.resize(200, 200)
		.composite([{ input: circleMask, blend: 'dest-in' }])
		.toBuffer()

	const borderedImage = await sharp(borderMask)
		.composite([{ input: profileImage, top: 5, left: 5 }])
		.png()
		.toBuffer()

	const template = sharp(templatePath).resize(1000, 600)
	const finalImageBuffer = await template
		.composite([{ input: borderedImage, top: 200, left: 385 }])
		.png()
		.toBuffer()

	const file = new AttachmentBuilder(finalImageBuffer, { name: `done-${avatarUrl}.png` })
	return file
}
