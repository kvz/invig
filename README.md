[![Build Status](https://travis-ci.org/kvz/invig.svg?branch=master)](https://travis-ci.org/kvz/invig)

# Invig

Breathe new life into legacy code bases:

 - Transpiling CoffeeScript to ES5
 - Transpiling ES5 to ES6 (without the stuff that recent Node hasn't nailed yet)
 - Applying <http://standardjs.com> linting via eslint
 - Adding the necessary linting and building boilerplate to the project's package.json
 
Invig does all this in a highly opinionated, non-configurabe, and **destructive** way. 

**WARNING**

Make sure your sources are safe under version control before point invig to your codebase. 
After that, have fun breathing new life into your legacy project 🤗💨🌿 

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

I suggest using `git diff` to inspect if you like the changes. 

## Limitations

- Invig needs a sense of a project so it can add eslint config and similar, so there needs to be a `package.json`, and this gets
**modified in place**, also.

## Troubleshooting

Sometimes failures happen because eslint wasn't able to make all the beautifications automatically. 
You can then open (CMD+Click if you set up your terminal correctly) the file in your editor, make the changes by hand,
and 

# Thanks to

- <https://github.com/decaffeinate/decaffeinate>
- <http://lebab.io>
- <http://eslint.org>
- <https://github.com/jlongster/prettier>
- <http://standardjs.com>

## Authors

 - [Kevin van Zonneveld](https://transloadit.com/about/#kevin)

## License

Copyright (c) 2016 Kevin van Zonneveld. Licenses under [MIT](LICENSE).
