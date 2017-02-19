[![Build Status](https://travis-ci.org/kvz/invig.svg?branch=master)](https://travis-ci.org/kvz/invig)

> Here's another one of my more upsetting projects 👌

<!--more-->

# 🌿 Invig

Breathes new life into legacy code bases by automatically:

 - Transpiling CoffeeScript to ES6
 - Transpiling ES5 to ES6 (without the stuff that recent Node hasn't nailed yet (e.g. we stick to `require` vs `import` for now))
 - Applying [Standard](http://standardjs.com) linting with colon alignment for enhanced readability
 - Adding the necessary linting and building run-script boilerplate that the project can later independently use
 - Optionally checking for outdated or unused dependencies
 
Invig does this in a highly opinionated, non-configurable, and **destructive** way. 

Let's have some fun breathing new life into your legacy project 😚 💨 🌿 

## Why

I'm dealing with an ever-growing number of projects that each have a slightly different setup, and I got pretty tired of context switching between ES5, ES6, CoffeeScript, and different code conventions across those projects.

The tools are there now to automate all difference away - it's just a matter of picking defaults and stringing those tools together. That's what Invig does. After successfully running Invig on your codebase, you can put your brain at ease thanks to uniformity, focus more on the work at hand, have a better time doing so thanks to syntactical goodness, while producing less bugs thanks to ESlint.

**Why ditch ES5?**

ES6 let's you express yourself in more powerful ways, typically meaning less boilerplate and more readable code.

**Why ditch CoffeeScript?**

While CoffeeScript lovers might agree already that uniform styling is pleasant and that ES6 is an upgrade over ES5, they might feel there are still a number of syntactical advantages CoffeeScript offers, missing from ES6. Our benchmark demo even results in lengthier ES6 code(!). While that may be true:

- The syntactical sugar argument is losing ground with every ECMA iteration (1 a year now) 
- The ES6 ecosystem is vast. This results in more resources online, being able to attract more developers to help with your project, and linters like Flow and ESLint that can prevent more possible bugs and errors than CoffeeLint can. 
- If you can refrain from using `import` and `async` (Invig won't leverage these), recent Node.js can run your code without any transpiling. Meaning quicker developer iterations and less headaches.

## Demo

<div align="center">
<img alt="Convert a CoffeeScript file to ES6" src="https://github.com/kvz/invig/raw/b68b038bce4caabc0543bbc09683be33830177d3/scripts/demo2.png">
</div>

## Install

Invig is meant to be run on a code base once (or a few times in one session). That's why it should not be used as a dependency but be installed globally instead.

```bash
npm install invig --global 
```

## Use

**⚠️ WARNING** Changes are made in-place, make sure your code is protected by version control before using Invig 

Port one ES5 file to ES6:

```bash
invig --src old-file.js
```

Port one CoffeeScript file to ES6 (deleting the old `.coffee` file.):

```bash
invig --src old-file.coffee
```

Port an entire directory of CoffeeScript or ES5 files to ES6:

```bash
invig --src src/
```

Optionally check for outdated or unused dependencies after the conversion completes:

```bash
invig --src src/ --check
```

Bail out as soon as Invig hits an error. By default Invig will continue processing the next file

```bash
invig --src src/ --bail
```

Do a dry run without changing any files (don't trust me, keep your stuff safe in Git):

```bash
invig --src src/ --dryrun
```

Apply Invig on a pattern (use quotes!)

```bash
invig --src 'src/**.js'
```

Transpile from STDIN

```bash
cat old-file.coffee | invig --src -
```

## Workflow 

The recommended way to use Invig is to:

1. Be in `master` and have a clean Git working tree first
1. `git checkout -b es6`
2. Run Invig on your repo, point it to wherever your legacy sources live
3. Apply manual fixes where the automation falls short (Invig will tell you)
4. Inspect the Git diff (I recommend the [GitHub Desktop](https://desktop.github.com) app for inspecting Invig's changes, even if you are a cli-god. Can't stress this enough) and repeat step 3 & 4
5. Commit, push, send a PR for your `es6` branch
6. Have someone review the PR and merge it
7. Let's celebrate that your codebase is now very much **2017** 🍸

## State

Invig is young, but as long as your code is in Git, feel free to have some fun with it.

Pre-`1.0.0`, we're allowing ourselves to make breaking changes at any release.

## Gotchas

- It's recommended to first make sure all CoffeeLint errors and warnings are fixed before porting your project
- Although Invig is destructive in nature, it currently leaves your `build` run script alone if you have already defined it. If you currently have CoffeeScript build tasks, remove them first, so that Invig can write the new one. 
The same goes for the `lint`, `fix`, and `build:watch` scripts, as well as the `.eslintrc`, and `.babelrc` files. The advantage of this that you can run Invig multiple times even though you have customized these components that are used in the modern setup.
- **⚠️ WARNING** Invig needs a sense of a project so that it can add ESLint config and similar, so from the first file you point it to, it traverses upwards to find a `package.json`, and **modifies this in-place** also.

## Thanks to

I deserve no credit, Invig is just a tiny wrapper around these mastodons:

- [Decaffeinate](https://github.com/decaffeinate/decaffeinate) (CoffeeScript to JavaScript)
- [Lebab](http://lebab.io) (ES5 to ES6)
- [Prettier](https://github.com/jlongster/prettier) (JavaScript consistent formatter)
- [ESLint](http://eslint.org) (JavaScript linter and fixer)
- [JavaScript Standard Style](http://standardjs.com) (One JavaScript Style Guide to Rule Them All)

## Invig in the Wild

Projects where Invig is used to breathe new life into old codebases:

- [Transloadit's Node.js SDK](https://github.com/transloadit/node-sdk/pull/40), Invig's first PR, changing a CoffeeScript codebase to ES6 💚 <https://github.com/transloadit/node-sdk/pull/40>
- [RethinkDB WebUI](https://github.com/rethinkdb/rethinkdb/pull/6262) is being ported from CoffeeScript to ES6

## Todo & Changelog

Please see [CHANGELOG.md](CHANGELOG.md)

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md)

## Social Media

Welcoming discussion on:

- [Reddit](https://www.reddit.com/r/javascript/comments/5p2swy/invig_automatically_converts_es5_coffeescript/)
- [Hacker News](https://news.ycombinator.com/item?id=13442421)

## Authors & Contributors

- [Kevin van Zonneveld](https://transloadit.com/about/#kevin)

## License

Copyright (c) 2017 Kevin van Zonneveld. Licenses under [MIT](LICENSE).
