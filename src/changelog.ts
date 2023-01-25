import {execSync} from 'node:child_process';

function run(command: string) {
	const out = execSync(command, {encoding: 'utf8', stdio: 'inherit'});
	return out.trim();
}

function getOriginUrl() {
	const remoteList = run('git --no-pager remote -v')
		.split('\n')
		.filter((v) => v.startsWith('origin'));

	if (remoteList.length === 0) return;

	// ssh
	let match = remoteList[0]?.match(/git@(?<domain>.*?):(?<repo>.*?\/.*?)\.git/);

	// or https
	if (match == null) {
		match = remoteList[0]?.match(/https:\/\/(?<domain>.*?)\/(?<repo>.*?\/.*?)\.git/);
	}

	if (match == null) return;

	const {domain, repo} = match.groups as {domain: string; repo: string};

	// always https
	return `https://${domain}/${repo}`;
}

function getLastTag() {
	return run('git --no-pager tag -l --sort=creatordate').split('\n').pop();
}

interface Commit {
	scope: string;
	isBreaking: boolean;
	description: string;
	shortHash: string;
}

function getCommits(from = getLastTag(), to = 'HEAD'): Commit[] {
	const commits = run(
		`git --no-pager log ${from ? `${from}...` : ''}${to} --pretty="%s|%h|%H"`
	)
		.split('\n')
		.map((line) => {
			const [message, shortHash, hash] = line.split('|');
			return {
				message,
				shortHash,
				hash,
			};
		});

	return commits
		.map((commit) => {
			if (commit.message == null || commit.hash == null) return null;
			// example:
			// scope description
			// scope! breaking changes
			// scope? ignore
			const match = commit.message?.match(
				/(?<scope>.+?)(?<breaking>!)?(?<ignore>\?)?: (?<description>.+)/i
			);
			// no matching or ignore
			if (match == null || match.groups == null || match.groups.ignore === '?')
				return null;

			const scope = (match.groups.scope || '').trim();
			const isBreaking = match.groups.breaking === '!';
			const description = (match.groups.description || '').trim();

			return {
				scope,
				isBreaking,
				description,
				shortHash: commit.shortHash,
				hash: commit.hash,
			};
		})
		.filter(Boolean) as Commit[];
}

export interface GetChangelogOptions {
	from?: string;
	to?: string;
	compareUrl?: boolean;
	hashUrl?: boolean;
}

export function getChangelog(options: GetChangelogOptions = {}) {
	const {from, to = 'HEAD', compareUrl = true, hashUrl = true} = options;
	const commits = getCommits(from, to);
	const groupedCommits = groupByScope(commits);
	const url = getOriginUrl();

	const withUrl = (hash: string) =>
		url == null || hashUrl !== true
			? hash.slice(0, 7)
			: `[${hash.slice(0, 7)}](${url}/commit/${hash})`;

	const changelog = [];
	for (const group in groupedCommits) {
		if (group.startsWith('chore')) continue;

		changelog.push(`- **${group}**`);
		for (const commit of groupedCommits[group]) {
			changelog.push(
				`  - ${commit.isBreaking ? ':warning: ' : ''}${commit.description} (${withUrl(
					commit.hash
				)})`
			);
		}
	}

	if (changelog.length === 0) {
		return 'No special changes.';
	}

	if (compareUrl === true && url != null && from != null && to != null && to !== 'HEAD') {
		changelog.push('', `[${from}...${to}](${url}/compare/${from}...${to})`);
	}

	return changelog.join('\n').trim();
}

function groupByScope(commits: Commit[] = []) {
	const group: Record<string, any> = {};
	for (const commit of commits) {
		group[commit.scope] ??= [];
		group[commit.scope].push(commit);
	}
	return group;
}
