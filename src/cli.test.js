const shelljs    = require('shelljs')
const fs         = require('fs')
const path       = require('path')
const globby     = require('globby')
const stripAnsi  = require('strip-ansi')
const fixDir     = `${__dirname}/../fixture`
const tmpDir     = `${__dirname}/../fixture/tmp`
const cliSpinner = require('cli-spinners').dots10

const removeVariance = (str) => {
  // @todo: Remove this hack when stolex no longer adds trailing spinner frames:
  cliSpinner.frames.forEach((frame) => {
    while (str.indexOf(frame) !== -1) {
      // console.log({str, frame})
      str = str.replace(frame, '---spinnerframe---')
    }
  })

  const envVars = ['HOME', 'USER']
  envVars.forEach((envVar) => {
    while (str.indexOf(process.env[envVar]) !== -1) {
      str = str.replace(process.env[envVar], `#{${envVar}}`)
    }
  })

  str = str.replace(/yarn install v\d+\.\d+\.\d+/g, 'yarn install vX.X.X')
  str = str.replace(/Done in \d+\.\d+s/g, 'Done in X.Xs')

  str = stripAnsi(str)

  return str
}

test('invigorates via cli', () => {
  const files = globby.sync([`${fixDir}/*.coffee`, `${fixDir}/*.js`])
  files.forEach((src) => {
    let base = path.basename(src)
    let dst  = `${tmpDir}/${base}`

    shelljs.cp('-f', path.dirname(src) + '/package.json', path.dirname(dst) + '/package.json')
    shelljs.cp('-f', src, dst)
    const cmd = `env SCROLEX_INTERVAL=10000 node ${__dirname}/cli.js --src "${dst}"`
    // console.log(cmd)
    const p = shelljs.exec(cmd)
    expect(removeVariance(p.stderr.trim())).toMatchSnapshot()
    expect(removeVariance(p.stdout.trim())).toMatchSnapshot()
    expect(p.code).toMatchSnapshot()
    expect(p.code).toBe(0)

    let result = fs.readFileSync(dst.replace(/\.coffee$/, '.js'), 'utf-8')
    expect(removeVariance(result.trim())).toMatchSnapshot()

    const pkg = fs.readFileSync(path.dirname(dst) + '/package.json', 'utf-8').trim()
    expect(pkg).toMatchSnapshot()
  })
})
