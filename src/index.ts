import parser from '@yme/argv';
import {getChangelog} from './changelog';

export interface Options {
	compare?: boolean;
	hash?: boolean;
}

export default async function main(args: string[]) {
	const argv = parser<Options>(args);

	const [from, to] = argv._;
	const {compare = true, hash = true} = argv;

	const changelog = getChangelog({
		from,
		to,
		compareUrl: compare,
		hashUrl: hash,
	});
	console.log(changelog);
}
