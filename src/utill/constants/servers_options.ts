import { CommandOption } from 'robo.js'

export const servers_req = {
	name: 'server',
	description: 'pick the target server',
	type: `string`,
	choices: [
		{
			name: `Hub`,
			value: `31b0d944`
		},
		{
			name: `SMP 2026`,
			value: `626a9019`
		},
		{
			name: `Creative`,
			value: `8dbb710c`
		},
		{
			name: `OLD SMPs`,
			value: `094a4a23`
		},
		{
			name: `Event HG`,
			value: `6d75e064`
		},
		{
			name: `Event HG`,
			value: `bcfd9927`
		},
		{
			name: `Event Spleef`,
			value: `c77745c3`
		}
	],
	required: true
} as CommandOption

export const servers_non_req = {
	name: 'server',
	description: 'pick the target server',
	type: `string`,
	choices: [
		{
			name: `Hub`,
			value: `31b0d944`
		},
		{
			name: `SMP`,
			value: `a814b3bd`
		},
		{
			name: `Factions`,
			value: `bd04a936`
		},
		{
			name: `Event Spleef`,
			value: `c77745c3`
		}
	],
	required: true
} as CommandOption
