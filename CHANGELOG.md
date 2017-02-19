# Changelog

Here's is a combined todo/done list. You can see what todos are planned for the upcoming release, as well as ideas that may/may not make into a release in `Ideas`. As per SemVer, we're allowing ourselves breaking changes `< 1`.

## Ideas

- [ ] Re-enable Prettier as a default optimizer once it's a little bit more mature

## master

Released: TBA.

[Diff](https://github.com/kvz/invig/compare/v0.0.13...master).

- [ ] Rewrite CoffeeScript mocha run scripts to `mocha --require babel-polyfill --compilers js:babel-register`

## v0.0.15

Released: 2017-02-19. 

[Diff](https://github.com/kvz/invig/compare/v0.0.14...v0.0.15).

- [x] Run Prettier by default now

## v0.0.14

Released: 2017-02-17. 

[Diff](https://github.com/kvz/invig/compare/v0.0.13...v0.0.14).

- [x] Upgrade to `scrolex@0.0.26` which will default to `passthru` `mode` on Travis CI and non-TTY environments

## v0.0.13

Released: 2017-02-15. 

[Diff](https://github.com/kvz/invig/compare/v0.0.12...v0.0.13).

- [x] Upgrade to `prettier@0.17.1` so we won't run into `TypeError: process.stdout.clearLine is not a function` https://github.com/jlongster/prettier/pull/687

## v0.0.12

Released: 2017-02-14. 

[Diff](https://github.com/kvz/invig/compare/v0.0.11...v0.0.12).

- [x] Fix callback bug

## v0.0.11

Released: 2017-02-14. 

[Diff](https://github.com/kvz/invig/compare/v0.0.10...v0.0.11).

- [x] Only add `build:watch` if you could add `build`

## v0.0.10

Released: 2017-02-14. 

[Diff](https://github.com/kvz/invig/compare/v0.0.9...v0.0.10).

- [x] Turn make no bail the default, you now have to explicitly use `--bail` (BREAKING)
- [x] Upgrade dependencies

## v0.0.9

Released: 2017-01-20. 

[Diff](https://github.com/kvz/invig/compare/v0.0.8...v0.0.9).

- [x] Ship babel & eslint as deps, not devDeps

## v0.0.8

Released: 2017-01-20. 

[Diff](https://github.com/kvz/invig/compare/v0.0.7...v0.0.8).

- [x] Add templates to module (fixing bug: `Error: ENOENT: no such file or directory, open '/usr/local/lib/node_modules/invig/lib/../.eslintrc'`)

## v0.0.7

Released: 2017-01-20. 

[Diff](https://github.com/kvz/invig/compare/0b5f2d27e4e5bfd370bf74fb91a46ded296bec40...v0.0.7).

- [x] Initial release
