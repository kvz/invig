const program         = require('commander')
const globby          = require('globby')
const applyEachSeries = require('async/applyEachSeries')
const queue           = require('async/queue')
const path            = require('path')
const fs              = require('fs')
const scrolex         = require('scrolex')
const debug           = require('depurar')('invig')
const pkgUp           = require('pkg-up')

const rootDir         = path.dirname(pkgUp.sync(__filename))
const npmDir          = `${rootDir}/node_modules`
const npmBinDir       = `${npmDir}/.bin`
const untildify       = require('untildify')

program
  .version(require('../package.json').version)
  .option('-i, --init', 'Init project dir, installs eslint config and such')
  .option('-s, --src <dir>', 'Directory or file to convert. DESTRUCTIVE. MAKE SURE IT\'S UNDER SOURCE CONTROL. ')
  .option('-d, --dryrun', 'Wether to execute commands or just output them')
  // .option('-c, --concurrency <int>', 'Directory to convert. DESTRUCTIVE. MAKE SURE IT\'S UNDER SOURCE CONTROL. ')
  .parse(process.argv)

if (!program.src) {
  console.error('You should provide at least a --src <dir> argument')
  process.exit(1)
}
if (!program.concurrency) { program.concurrency = 1 }
if (!program.init) { program.init = false }
if (!program.package) { program.package = pkgUp.sync(program.dir) }

program.src = untildify(program.src)
program.dryrun = !!program.dryrun

const opts = (opts) => {
  const defaultOpts = {}
  defaultOpts.singlescroll = true
  if (program.dryrun === true) {
    defaultOpts.announce = true
    defaultOpts.dryrun   = true
  }
  return Object.assign({}, defaultOpts, opts)
}

const initProject = (packagePath, cb) => {
  
}

const toJs = (srcPath, cb) => {
  const cmd = `${npmBinDir}/decaffeinate --keep-commonjs --prefer-const --loose-default-params ${srcPath}`
  scrolex.exe(cmd, opts({ components: `invig>${srcPath}>toJs` }), cb)
}

const toEs6 = (srcPath, cb) => {
  const safe = [
    'arrow',
    'for-of',
    'for-each',
    'arg-rest',
    'arg-spread',
    'obj-method',
    'obj-shorthand',
    'no-strict',
    'multi-var',
    // 'commonjs',
    // 'exponent',
  ]
  const unsafe = [
    'let',
    'class',
    'template',
    'default-param',
    'destruct-param',
    // 'includes'
  ]

  const list = [].concat(safe, unsafe).join(',')
  const cmd = `${npmBinDir}/lebab --transform=${list} ${srcPath} --out-file ${srcPath}.es6 && mv -f ${srcPath}.es6 ${srcPath}`

  scrolex.exe(cmd, opts({ components: `invig>${srcPath}>toEs6` }), cb)
}

const toPrettier = (srcPath, cb) => {
  const cmd = `${npmBinDir}/prettier --write ${srcPath} --fix ${srcPath}`
  scrolex.exe(cmd, opts({ components: `invig>${srcPath}>toPrettier` }), cb)
}

const toEslintStandard = (srcPath, cb) => {
  const cmd = `${npmBinDir}/eslint --fix ${srcPath}`
  scrolex.exe(cmd, opts({ components: `invig>${srcPath}>toEslintStandard` }), cb)
}

const convertFile = (srcPath, cb) => {
  const fns       = []
  const extension = path.extname(srcPath).toLowerCase()
  if (extension === 'coffee') {
    fns.push(toJs)
  }
  fns.push(toEs6)
  fns.push(toPrettier)
  fns.push(toEslintStandard)

  applyEachSeries(fns, srcPath, cb)
}

if (program.init) {
  initProject(program.package)
} else {
  let files = []
  if (fs.lstatSync(program.src).isFile()) {
    // File
    files = [program.src]
  } else if (fs.lstatSync(program.src).isDirectory()) {
    // Directory
    const pattern = [`${program.src}/**/*.js`, `${program.src}/**/*.coffee`]
    files         = globby.sync(pattern)
  } else {
    // Pattern
    files = globby.sync(program.src)
  }

  if (!files || files.length === 0) {
    console.error(`Source argument: "${program.src}" returned no input files to work on.`)
    process.exit(1)
  }
  debug({files})
  const q = queue(convertFile, program.concurrency)
  q.push(files)
  q.drain = () =>
    console.log('Done. ')
}
