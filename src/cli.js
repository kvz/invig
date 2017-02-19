#!/usr/bin/env node
const program         = require('commander')
const getStdin        = require('get-stdin')
const path            = require('path')
const Invig           = require('./Invig')
const pkgUp           = require('pkg-up')
const scrolex         = require('scrolex')

const rootDir   = path.dirname(pkgUp.sync(__filename))
const npmDir    = `${rootDir}/node_modules`
const npmBinDir = `${npmDir}/.bin`
const untildify = require('untildify')

program
  .version(require('../package.json').version)
  .option('-s, --src <dir>', "Directory or file to convert. DESTRUCTIVE. MAKE SURE IT'S UNDER SOURCE CONTROL. ")
  .option('-b, --bail', 'Abort on the first error instead of continuing to port the next file')
  .option('-c, --check', 'When done, run dependency check to see if there are unused or unupdated ones')
  .option('-d, --dryrun', 'Wether to execute commands or just output them')
  .option('-q, --quiet', 'Hide any output')
  .parse(process.argv)

if (!('concurrency' in program)) {
  program.concurrency = 1
}

program.src    = untildify(program.src)
program.init   = !!program.init
program.dryrun = !!program.dryrun
program.bail   = !!program.bail
program.quiet  = !!program.quiet

scrolex.persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `invig`,
  shell                : true,
  fatal                : program.bail,
  dryrun               : program.dryrun,
})
if (program.quiet === true) {
  scrolex.persistOpts({
    mode: 'silent',
  })
}

if (!('src' in program)) {
  scrolex.failure('You should provide at least a --src <dir> argument')
  process.exit(1)
}

const invig = new Invig({
  src        : program.src,
  dryrun     : program.dryrun,
  bail       : program.bail,
  init       : program.init,
  quiet      : program.quiet,
  concurrency: program.concurrency,
  npmBinDir  : npmBinDir,
})

getStdin().then(stdin => {
  let method = null
  if (program.src === '-') {
    if (!stdin) {
      scrolex.failure(`There was no STDIN, yet '--src -' was specified`)
      process.exit(1)
    }
    method = invig.runOnStdIn.bind(invig, stdin)
  } else {
    method = invig.runOnPattern.bind(invig)
  }

  method((err) => {
    if (err) {
      scrolex.failure(`${err}`)
      process.exit(1)
    } else {
      scrolex.success(`Done`)
    }
  })
})
