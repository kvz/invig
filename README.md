[![Build Status](https://travis-ci.org/kvz/invig.svg?branch=master)](https://travis-ci.org/kvz/invig)

# Invig

Breathe new life into legacy code bases by automatically:

 - Transpiling CoffeeScript to ES6
 - Transpiling ES5 to ES6 (without the stuff that recent Node hasn't nailed yet (e.g. we stick to `require` vs `import` for now))
 - Applying Standard linting via eslint
 - Adding the necessary linting and building boilerplate to the project's package.json

**WARNING**

Make sure your sources are safe under version control before point invig to your codebase. 
After that, have fun breathing new life into your legacy project 🤗💨🌿 

## Why

I got tired of context switching between ES5, ES6, CoffeeScript, and different code conventions.

The tools are there now. All code can look the same. It's just a matter of stringing them together.

That's what Invig does, be it in a in a highly opinionated, and **destructive** way. 

## Install

```bash
yarn global add invig || npm install --global invig
```

## Use

```bash
invig --src old-file.coffee
# results in old-file.js in ES6
```

```bash
invig --src old-file.js
# results in old-file.js in ES6 - Original file destroyed forever unless under version control!
```

```bash
invig --src src/
# results in all coffee and js files in `src/` converted to ES6 - In place! Original `src/` destroyed forever unless under version control
```

```bash
invig --src src/ --nobail
# Ignore any error and continue with the operation for the next file. By default, Invig will abort on the first error for manual intervention
```

I suggest using `git diff` to inspect if you like the changes. 

## State

Invig is Young! Pre-`1.0.0`, we're allowing ourselves to make breaking changes at any release.

## Gotchas

- Although Invig is destructive in nature, it currently leaves your `build` runtasks alone if you have already defined them. If you currently have
CoffeeScript build tasks, remove them first, so that Invig can write the new one. 
Same goes for the `lint`, `fix`, and `build:watch` scripts, as well as the `.eslintrc`, and `.babelrc` files. The advantage of this that you 
can run Invig multiple times even though you have customized these components that are used in the modern setup.

## Limitations

- Invig needs a sense of a project so it can add eslint config and similar, so there needs to be a `package.json`, and this gets
**modified in place**, also.

## Troubleshooting

Sometimes failures happen because eslint wasn't able to make all the beautifications automatically. 
You can then open (CMD+Click if you set up your terminal correctly) the file in your editor, make the changes by hand,
and 

## Thanks to

Invig is just a wrapper around these beasts:

- <https://github.com/decaffeinate/decaffeinate>
- <http://lebab.io>
- <http://eslint.org>
- <https://github.com/jlongster/prettier>
- <http://standardjs.com>

## Todo

- [ ] Rewrite coffeescript mocha to `mocha --require babel-polyfill --compilers js:babel-register`
- [ ] Support for <https://github.com/jlongster/prettier> is already added, but disabled, as there are still some issues (like adding trailing commas to function arguments). It's traveling fast tho, so check back soon to see if we can enable it as a pre-step to eslint standard, that will give us `go fmt`-like strictness.

## Authors

- [Kevin van Zonneveld](https://transloadit.com/about/#kevin)

## License

Copyright (c) 2017 Kevin van Zonneveld. Licenses under [MIT](LICENSE).
