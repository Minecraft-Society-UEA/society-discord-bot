import nodemailer from 'nodemailer'

// the user and pass for the smtp server
const user = process.env.gmail_user as string
const pass = process.env.gmail_pass as string

// the transporter nodmalier object to connect to the smtp server
const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: user,
		pass: pass
	}
})

export async function emailCode(email: string, code: string, username: string) {
	// urls and some bits in the html email are verables to make them custom and easier to change
	const VERIFICATION_CODE = code
	const LOGO_URL = `https://media.discordapp.net/attachments/1403422858499198997/1425471337002041425/Untitled82_20250811081052.png?ex=68e7b522&is=68e663a2&hm=c6786bfb30d0856005cee2b2b24a8b06f2545b6ef365c2fcebbc170720171660&=&format=webp&quality=lossless&width=960&height=960`
	const SERVER_NAME = `UEA Minecraft Society`
	const NAME = username
	const VERIFY_URL = `https://discord.com/channels/1403421910557130842/1418026676469633144`
	const DIRT_IMAGE_URL = `https://media.discordapp.net/attachments/1403422858499198997/1425472251490467861/mc-dirt_block.png?ex=68e7b5fc&is=68e6647c&hm=e46e4d8b00ef551ee7536e110ee523f467f569c7bc3bf8ba60370cfe6bdf8947&=&format=webp&quality=lossless`
	const SUPPORT_EMAIL = user
	const DISCORD_URL = `https://discord.gg/KRBY8WvnJy`
	const INSTAGRAM_URL = `https://www.instagram.com/ueamcsoc`
	const DISCORD_IMG_URL = `https://media.discordapp.net/attachments/1403422858499198997/1425472252002042019/discord-logo.png?ex=68e7b5fc&is=68e6647c&hm=40139874797427ca2afd1ce10ef5eef6d4fe8dcc5d7524857edd1ddcd4552413&=&format=webp&quality=lossless&width=748&height=856`
	const INSTAGRAM_IMG_URL = `https://media.discordapp.net/attachments/1403422858499198997/1425472252366950430/Instagram_icon.png?ex=68e7b5fc&is=68e6647c&hm=85842a2ff66d02b3280fca6aeead8c47ce29a07eaa9f80e5e53378b06b2cb5dc&=&format=webp&quality=lossless&width=856&height=856`
	const CURRENT_YEAR = new Date().getFullYear()

	/// sending the email and the emails html code
	await transporter.sendMail({
		from: `"${SERVER_NAME}" <${user}>`,
		to: `${email}`,
		subject: 'Your verification code for the UEA Minecraft server',
		html: `
<html lang="en">
	<body style="margin: 0; padding: 0; background: #0a0f0a; font-family: Arial, sans-serif; color: #e6f2e6">
		<!-- Preheader (hidden preview text) -->
		<div style="display: none; visibility: hidden; opacity: 0; height: 0; width: 0; overflow: hidden">
			Your verification code for the UEA Minecraft server is ${VERIFICATION_CODE}.
		</div>

		<table role="presentation" width="100%" bgcolor="#0a0f0a" align="center">
			<tr>
				<td align="center" style="padding: 20px">
					<!-- Main card -->
					<table
						role="presentation"
						width="600"
						style="max-width: 600px; background: #121a12; border-radius: 12px; border: 1px solid #1e2b1e"
					>
						<!-- Logo -->
                        <tr>
                            <td style="padding: 20px; text-align: center;">
                                <img src="${LOGO_URL}" alt="UEA Minecraft Society" width="120" style="display: inline-block;" />
                            </td>
                        </tr>

						<!-- Content -->
						<tr>
							<td style="padding: 20px; color: #e6f2e6">
								<h1 style="margin: 0 0 10px; font-size: 22px">Verify your email to join the ${SERVER_NAME}</h1>
								<p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #a7c3a7">
									Hi ${NAME},<br />
									Use the code below to verify your email on Discord.
								</p>
							</td>
						</tr>

						<!-- Code -->
						<tr>
							<td align="center" style="padding: 10px 20px 20px">
								<div
									style="
										display: inline-block;
										border: 2px solid #2d5a36;
										background: #1e2b1e;
										border-radius: 8px;
										padding: 14px 20px;
										font-family: monospace;
										font-size: 24px;
										font-weight: bold;
										color: #e6f2e6;
										letter-spacing: 3px;
									"
								>
									${VERIFICATION_CODE}
								</div>
							</td>
						</tr>

						<!-- Button -->
						<tr>
							<td align="center" style="padding: 0 20px 20px">
								<a
									href="${VERIFY_URL}"
									style="
										display: inline-block;
										background: #2f6e3b;
										color: #0a0f0a;
										text-decoration: none;
										font-weight: bold;
										font-size: 15px;
										padding: 12px 24px;
										border-radius: 8px;
									"
								>
									Verify & Continue
								</a>
							</td>
						</tr>

						<tr>
							<td style="padding: 0 20px 20px; font-size: 12px; color: #a7c3a7">
								If the button doesn’t work, dont worry its just a link to the button sent to you in Discord.
							</td>
						</tr>

						<!-- Divider -->
						<tr>
							<td><hr style="border: none; height: 1px; background: #1e2b1e" /></td>
						</tr>

						<!-- Tip -->
						<tr>
							<td style="padding: 20px; font-size: 12px; color: #a7c3a7">
								<img
									src="${DIRT_IMAGE_URL}"
									width="40"
									height="40"
									alt="Minecraft icon"
									style="vertical-align: middle; margin-right: 10px; border-radius: 6px; background: #2d5a36"
								/>
								Tip: Never share your code — The UEA Minecraft Society Committee will <strong>never</strong> ask for it.
							</td>
						</tr>

						<!-- Footer -->
						<tr>
							<td style="padding: 20px; font-size: 11px; color: #6a8a71; text-align: center">
								Sent by the UEA Minecraft Society · Norwich, UK<br />
								Need help? <a href="mailto:${SUPPORT_EMAIL}" style="color: #7bd88f">${SUPPORT_EMAIL}</a><br /><br />
								<a href="${DISCORD_URL}"
									><img src="${DISCORD_IMG_URL}" width="50" alt="Discord" style="margin: 0 4px"
								/></a>
								<a href="${INSTAGRAM_URL}"
									><img src="${INSTAGRAM_IMG_URL}" width="50" alt="Instagram" style="margin: 0 4px" /></a
								><br /><br />
								You received this email because someone attempted to verify using this address. If this wasn’t you,
								ignore it.<br />
								© ${CURRENT_YEAR} UEA Minecraft Society. Not affiliated with Mojang.
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>
`
	})
}
