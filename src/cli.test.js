const shelljs        = require('shelljs')
const fs             = require('fs')
const path           = require('path')
const childProcess  = require('child_process')
const globby         = require('globby')
const fixDir         = `${__dirname}/../fixture`
const tmpDir         = `${__dirname}/../fixture/tmp`
const removeVariance = require('./removeVariance')

shelljs.rm('-fR', tmpDir)
shelljs.mkdir('-p', tmpDir)
shelljs.touch(tmpDir + '/.empty')

describe('Invig', () => {
  describe('cli', () => {
    test('invigorates an entire directory', () => {
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
    test('invigorates via stdin', (done) => {
      const child = childProcess.spawn(process.argv[0], [`${__dirname}/cli.js`, `-qs`, `-`], {
        env: {
          SCROLEX_MODE: `passthru`,
        },
      })

      child.stdin.write(`console.log("hello")`)
      child.stdin.end()

      let buf = ''
      child.stdout.on('data', (data) => {
        buf += `${data}`
      })

      child.on('close', (code) => {
        expect(removeVariance(buf)).toMatchSnapshot()
        done()
      })
    })
  })
})
