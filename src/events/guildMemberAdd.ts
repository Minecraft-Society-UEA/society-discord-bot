import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	GuildMember,
	HexColorString,
	Role
} from 'discord.js'
import path from 'path'
import { Flashcore } from 'robo.js'
import sharp from 'sharp'
import { welcome_settings, role_storage, getSettingByid } from '~/utill'

type setting_type = {
	setting: welcome_settings
}

export default async (member: GuildMember) => {
	const roles = (await Flashcore.get(`mc_role_id`)) as role_storage
	const role = (await member.guild.roles.cache.get(roles.unverified)) as Role

	await member.roles.add(role)

	const settings = (await getSettingByid(`welcome_message`)) as setting_type
	const embed = new EmbedBuilder()
	const button = new ButtonBuilder()
	const guild = member.guild
	const channel = guild?.channels.cache.get(`${settings.setting.channelid}`)
	const path = convertPath(settings.setting.path)
	const file = (await image_process(
		settings.setting.colourhex,
		member.user.displayAvatarURL(),
		path,
		member.user.id
	)) as AttachmentBuilder

	if (!channel || !channel.isTextBased()) {
		console.error('Channel not found or is not a text channel')
		return
	}

	button
		.setLabel(`Become A Member!`)
		.setURL(`https://www.ueasu.org/communities/societies/group/minecraft/`)
		.setStyle(ButtonStyle.Link)
		.setEmoji(`🌟`)

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button)

	embed
		.setTitle(settings.setting.title)
		.setColor(settings.setting.colourhex)
		.setImage(`attachment://done-${member.user.id}.png`)

	await channel.send({ content: `${member}`, embeds: [embed], files: [file], components: [row] })
	return
}

export const convertPath = (configPath: string) => {
	const segments = configPath.split(/[\\/]/)

	const templatePath = path.join(process.cwd(), ...segments)

	return templatePath
}

export async function image_process(hexcolor: HexColorString, avatarUrl: string, path: any, userid: string) {
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
		.composite([{ input: borderedImage, top: 100, left: 385 }])
		.png()
		.toBuffer()

	const file = new AttachmentBuilder(finalImageBuffer, { name: `done-${userid}.png` })
	return file
}
