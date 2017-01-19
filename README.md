[![Build Status](https://travis-ci.org/kvz/invig.svg?branch=master)](https://travis-ci.org/kvz/invig)

> Here's another one of my more upsetting projects 👌

# Invig

Breathe new life into legacy code bases by automatically:

 - Transpiling CoffeeScript to ES6
 - Transpiling ES5 to ES6 (without the stuff that recent Node hasn't nailed yet (e.g. we stick to `require` vs `import` for now))
 - Applying Standard linting via ESLint
 - Adding the necessary linting and building boilerplate to the project's package.json
 
Invig does this in a highly opinionated, non-configurable, and **destructive** way. 

**WARNING**

Make sure your sources are safe under version control before point Invig to your codebase. 
After that, have fun breathing new life into your legacy project 🤗💨🌿 

## Why

I got tired of context switching between ES5, ES6, CoffeeScript, and different code conventions.

The tools are there now. It's just a matter of stringing them together, and all code can be present day ECMA and look uniformly styled.

## Install

```bash
yarn global add invig || npm install --global invig
```

## Use

Port one CoffeeScript file to ES6 (deleting the old `.coffee` file.):

```bash
invig --src old-file.coffee
```

Port one ES5 file to ES6 (original file destroyed forever unless under version control):

```bash
invig --src old-file.js
```

Port an entire directory of CoffeeScript or ES5 files to ES6 (In place. The original `src/` contents are destroyed forever unless under version control):

```bash
invig --src src/
```

Ignore any error and continue with the operation for the next file. By default, Invig will abort on the first error for manual intervention:

```bash
invig --src src/ --nobail
```

## Flow 

The recommended way to use Invig is to:

1. Be in `master` and have a clean Git working tree first
1. `git checkout -b es6`
2. Run Invig on your repo, point it to wherever your legacy sources live
3. Apply manual fixes where the automation falls short (Invig will tell you)
4. Inspect the git diff (I recommend the [GitHub Desktop](https://desktop.github.com) app for inspecting Invig's changes, even if you are a cli god. Can't stress this enough) and repeat step 2 & 3
5. Commit, push, send a PR for your `es6` branch
6. Let's celebrate that your codebase is now very much **2017** 🍸

## State

Invig is Young! Pre-`1.0.0`, we're allowing ourselves to make breaking changes at any release.

## Gotchas

- Although Invig is destructive in nature, it currently leaves your `build` run script alone if you have already defined it. If you currently have
CoffeeScript build tasks, remove them first, so that Invig can write the new one. 
The same goes for the `lint`, `fix`, and `build:watch` scripts, as well as the `.eslintrc`, and `.babelrc` files. The advantage of this that you 
can run Invig multiple times even though you have customized these components that are used in the modern setup.
- Support for <https://github.com/jlongster/prettier> is already added, but disabled, as there are still some issues (like adding trailing commas to function arguments). It's traveling fast tho, so check back soon to see if we can enable it as a pre-step to ESLint standard, that will give us `go fmt`-like strictness. If you want to enable Prettier, prefix your Invig commands with `env INVIG_PRETTIER=1 `
- Invig needs a sense of a project so it can add ESLint config and similar, so there needs to be a `package.json`, and this gets **modified in place**, also.

## Thanks to

Invig is just a tiny wrapper around these mastodons:

- <https://github.com/decaffeinate/decaffeinate>
- <http://lebab.io>
- <http://eslint.org>
- <https://github.com/jlongster/prettier>
- <http://standardjs.com>

## Todo

- [ ] Rewrite coffeescript mocha to `mocha --require babel-polyfill --compilers js:babel-register`

## Authors

- [Kevin van Zonneveld](https://transloadit.com/about/#kevin)

## License

Copyright (c) 2017 Kevin van Zonneveld. Licenses under [MIT](LICENSE).
