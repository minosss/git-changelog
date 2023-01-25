# git-changelog [![v](https://img.shields.io/npm/v/@yme/git-changelog?color=5755d9&label=)](https://www.npmjs.com/package/@yme/git-changelog)

### Install

```sh
pnpm -g add @yme/git-changelog
```

### Usage

```
git-changelog

# scope!: breaking changes
# scope: description
# scope?: ignore
# chore: ignore start with chore
git changelog [from] [to]

Options

--compare		include vertion compare url
--hash			include commit url

```

### Example

```sh
# get tag list and use latest two tag as [from] and [to]
# git --no-pager tag -l --sort=creatordate | awk '{y=x " " $0;x=$0};END{print y}'
git changelog v0.3.0 v0.3.1
```

Output

```md
- **changelog**
  - Add origin url to commit hash ([1b9b79e](https://github.com/minosss/git-bump/commit/1b9b79ee64396deb7a409729db0f241cde5e702b))

[v0.3.0...v0.3.1](https://github.com/minosss/git-bump/compare/v0.3.0...v0.3.1)
```

### Use in Github Action

```yml
- name: Checkout
  uses: actions/checkout@v3
    with:
      # ensure fetch all history
      fetch-depth: 0

# generate changelog and save to body.md
- name: Generate changelog
  run: npx @yme/git-changelog $(git --no-pager tag -l --sort=creatordate | awk '{y=x " " $0;x=$0};END{print y}') > body.md

# create release with body.md
- name: Create release
  uses: ncipollo/release-action@v1
  with:
    bodyFile: "body.md"
    token: ${{ secrets.GITHUB_TOKEN }}
```
