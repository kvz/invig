const stripAnsi = require('strip-ansi')
const path      = require('path')
const cliSpinner = require('cli-spinners').dots10

const removeVariance = (input) => {
  if (input && input.message) {
    input.message = removeVariance(input.message)
  }
  if (`${input}` !== input) {
    for (let k in input) {
      input[k] = removeVariance(input[k])
    }
    return input
  }

  const map = {
    SCROLEX_ROOT: path.resolve(path.join(__dirname, '..')),
    PWD         : process.cwd(),
    HOME        : process.env.HOME,
    USER        : process.env.USER,
  }

  for (let key in map) {
    let val = map[key]
    while (input.indexOf(val) !== -1) {
      input = input.replace(val, `#{${key}}`)
    }
  }

  input = stripAnsi(input)

  input = input.replace(/^.*Already up-to-date.*\n/gm, '')
  input = input.replace(/^.*Building fresh packages.*\n/gm, '')
  input = input.replace(/^.*Fetching package.*\n/gm, '')
  input = input.replace(/^.*fsevents.*Excluding it from installation.*\n/gm, '')
  input = input.replace(/^.*fsevents.*incompatible with this module.*\n/gm, '')
  input = input.replace(/^.*Linking dependencies.*\n/gm, '')
  input = input.replace(/^.*peer dependency "es6-promise.*\n/gm, '')
  input = input.replace(/^.*Resolving packages.*\n/gm, '')
  input = input.replace(/^.*There appears to be trouble with your network connection.*\n/gm, '')
  input = input.replace(/Done in \d+\.\d+s/g, 'Done in X.Xs')
  input = input.replace(/\d+ms/g, 'XXms')
  input = input.replace(/yarn install v\d+\.\d+\.\d+/g, 'yarn install vX.X.X')

  // @todo: Remove this hack when scrolex no longer adds trailing spinner frames:
  cliSpinner.frames.forEach((frame) => {
    while (input.indexOf(frame) !== -1) {
      // console.log({input, frame})
      input = input.replace(frame, '---spinnerframe---')
    }
  })

  return input
}

module.exports = removeVariance
