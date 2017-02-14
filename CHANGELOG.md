# Changelog

Here's is a combined todo/done list. You can see what todos are planned for the upcoming release, as well as ideas that may/may not make into a release in `Ideas`. As per SemVer, we're allowing ourselves breaking changes `< 1`.

## Ideas

- [ ] Re-enable Prettier as a default optimizer once it's a little bit more mature

## v0.0.13

Released: TBA.

[Diff](https://github.com/transloadit/transloadify/compare/v0.0.12...master).

- [ ] Rewrite CoffeeScript mocha run scripts to `mocha --require babel-polyfill --compilers js:babel-register`

## v0.0.12

Released: 2017-02-14. 

[Diff](https://github.com/transloadit/transloadify/compare/v0.0.11...v0.0.12).

- [x] Fix callback bug

## v0.0.11

Released: 2017-02-14. 

[Diff](https://github.com/transloadit/transloadify/compare/v0.0.10...v0.0.11).

- [x] Only add `build:watch` if you could add `build`

## v0.0.10

Released: 2017-02-14. 

[Diff](https://github.com/transloadit/transloadify/compare/v0.0.9...v0.0.10).

- [x] Turn make no bail the default, you now have to explicitly use `--bail` (BREAKING)
- [x] Upgrade dependencies

## v0.0.9

Released: 2017-01-20. 

[Diff](https://github.com/transloadit/transloadify/compare/v0.0.8...v0.0.9).

- [x] Ship babel & eslint as deps, not devDeps

## v0.0.8

Released: 2017-01-20. 

[Diff](https://github.com/transloadit/transloadify/compare/v0.0.7...v0.0.8).

- [x] Add templates to module (fixing bug: `Error: ENOENT: no such file or directory, open '/usr/local/lib/node_modules/invig/lib/../.eslintrc'`)

## v0.0.7

Released: 2017-01-20. 

[Diff](https://github.com/transloadit/transloadify/compare/0b5f2d27e4e5bfd370bf74fb91a46ded296bec40...v0.0.7).

- [x] Initial release
