const shelljs    = require('shelljs')
const fs         = require('fs')
const path       = require('path')
const globby     = require('globby')
const fixDir     = `${__dirname}/../fixture`
const tmpDir     = `${__dirname}/../fixture/tmp`
const removeVariance = require('./removeVariance')

shelljs.rm('-fR', tmpDir)
shelljs.mkdir('-p', tmpDir)
shelljs.touch(tmpDir + '/.empty')

test('invigorates via cli', () => {
  const files = globby.sync([`${fixDir}/*.coffee`, `${fixDir}/*.js`])
  files.forEach((src) => {
    let base = path.basename(src)
    let dst  = `${tmpDir}/${base}`

    shelljs.cp('-f', path.dirname(src) + '/package.json', path.dirname(dst) + '/package.json')
    shelljs.cp('-f', src, dst)
    const cmd = `env SCROLEX_MODE=passthru node ${__dirname}/cli.js --src "${dst}"`
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
