#!/usr/bin/env node
import program from 'commander'
import getStdin from 'get-stdin'
import path from 'path'
import Invig from './Invig'
import pkgUp from 'pkg-up'
import scrolex from 'scrolex'
import untildify from 'untildify'

const rootDir = path.dirname(pkgUp.sync(__filename))
const npmDir = `${rootDir}/node_modules`
const npmBinDir = `${npmDir}/.bin`

program
  .version(require('../package.json').version)
  .option('-s, --src <dir>', "Directory or file to convert. DESTRUCTIVE. MAKE SURE IT'S UNDER SOURCE CONTROL. ")
  .option('-b, --bail', 'Abort on the first error instead of continuing to port the next file')
  .option('-c, --check', 'When done, run dependency check to see if there are unused or unupdated ones')
  .option('-d, --dryrun', 'Wether to execute commands or just output them')
  .option('-q, --quiet', 'Hide any output')
  .option('-7, --es7', 'generate es7')
  .parse(process.argv)

if (!('src' in program)) {
  scrolex.failure('You should provide at least a --src <dir> argument')
  process.exit(1)
}

program.src = untildify(program.src)
program.init = !!program.init
program.dryrun = !!program.dryrun
program.bail = !!program.bail
program.quiet = !!program.quiet

scrolex.persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : 'invig',
  shell                : true,
  fatal                : program.bail,
  dryrun               : program.dryrun,
})
if (program.quiet === true) {
  scrolex.persistOpts({
    mode: 'silent',
  })
}

const invig = new Invig({
  src   : program.src,
  check : program.check,
  dryrun: program.dryrun,
  bail  : program.bail,
  init  : program.init,
  quiet : program.quiet,
  npmBinDir,
  es7   : program.es7,
})

if (program.src === '-') {
  getStdin().then(stdin => {
    invig
      .runOnStdIn(stdin)
      .catch(err => {
        scrolex.failure(`${err}`)
        process.exit(1)
      })
      .then(() => {
        scrolex.success(`Done`)
      })
  })
} else {
  invig
    .runOnPattern()
    .catch(err => {
      scrolex.failure(`${err}`)
      process.exit(1)
    })
    .then(() => {
      scrolex.success(`Done`)
    })
}
