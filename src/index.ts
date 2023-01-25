import parser from '@yme/argv';
import {getChangelog} from './changelog';

export interface Options {
	compare?: boolean;
	hash?: boolean;
	help?: boolean;
}

const HELP = `
git-changelog

git changelog [from] [to]

Options

--compare		include vertion compare url
--hash			include commit url
`;

export default async function main(args: string[]) {
	const argv = parser<Options>(args);

	const [from, to] = argv._;
	const {compare = true, hash = true, help} = argv;

	if (help) {
		console.log(HELP);
		return;
	}

	const changelog = getChangelog({
		from,
		to,
		compareUrl: compare,
		hashUrl: hash,
	});
	console.log(changelog);
}
