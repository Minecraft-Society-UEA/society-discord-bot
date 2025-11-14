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
import { welcome_settings, role_storage, getSettingByid, log } from '~/utill'

type setting_type = {
	setting: welcome_settings
}

export default async (member: GuildMember) => {
	try {
		member.send(
			"## Great! You've joined our Discord, what's next?\n➥ **Join our Minecraft server!**\n> __Java Edition__\n> ```Address: play.ueamcsociety.net```\n> __Bedrock Edition__\> ```Address: play-br.ueamcsociety.net\n> Port: 37583```\n### ➥ **Go to https://discord.com/channels/1403421910557130842/1418026676469633144**\n> Run these commands in order **(don't include brackets)**:\n> \n> -# Bedrock players need to add a dot prefix and an underscore for spaces: e.g. `.Steve_Life`\n> -# Type the code sent to you in Minecraft into Discord.\n> ```/verify mc {mc-username}```\n> -# In the format `abc25xyz@uea.ac.uk`. Wait for another code sent via email.\n> ```/verify email {uea-email}```\n> -# Make sure you have a membership else this won't work! [Become a member now!](https://www.ueasu.org/communities/societies/group/minecraft/)\n> ```/verify member```\n> After this, you will gain access to the UEA SMP as well as other servers!\n### Confused? Visit  ➥ https://discord.com/channels/1403421910557130842/1415612281022189578\n\n### Want to speak to a committee member for help?\n## DM the Bot your Questions!"
		)
	} catch (error) {
		log.warn(`Unable to DM (${member.nickname ?? member.displayName}) due to there DM settings`)
	}

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
