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
	const LOGO_URL = `https://photo.uncommmon.dev/i/24aef466-9364-4f62-8c38-8d1c2dc1b6e6.png`
	const SERVER_NAME = `UEA Minecraft Society`
	const NAME = username
	const VERIFY_URL = `https://discord.com/channels/1403421910557130842/1418026676469633144`
	const DIRT_IMAGE_URL = `https://photo.uncommmon.dev/i/1de0d2e2-c3bd-44a6-94af-9a7d82c007e0.png`
	const SUPPORT_EMAIL = user
	const DISCORD_URL = `https://discord.gg/KRBY8WvnJy`
	const INSTAGRAM_URL = `https://www.instagram.com/ueamcsoc`
	const DISCORD_IMG_URL = `https://photo.uncommmon.dev/i/375efc0b-b565-4fb4-9d08-c8497e30192c.png`
	const INSTAGRAM_IMG_URL = `https://photo.uncommmon.dev/i/5b4e1905-57cf-4046-9df1-6f0fe348776c.png`
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
