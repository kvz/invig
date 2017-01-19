#!/usr/bin/env node
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

program.src    = untildify(program.src)
program.dryrun = !!program.dryrun

const scrolexOpts = (opts) => {
  const defaultOpts = {}
  defaultOpts.mode = 'singlescroll'
  defaultOpts.shell    = true
  defaultOpts.announce = true
  defaultOpts.fatal    = true
  if (program.dryrun === true) {
    defaultOpts.announce = true
    defaultOpts.dryrun   = true
  }
  return Object.assign({}, defaultOpts, opts)
}

const initProject = (projectPackagePath, cb) => {
  const projectPackage = require(projectPackagePath)
  const projectRoot    = path.dirname(projectPackagePath)
  const projectRootRel = path.relative(process.cwd(), projectRoot)
  const invigRoot      = `${__dirname}/..`
  // const invigRootRel   = path.relative(process.cwd(), invigRoot)
  const invigPackage   = require(`${invigRoot}/package.json`)

  scrolex.out('Adding eslint project config', { components: `invig>${projectRootRel}>toEslintStandard` })
  if (program.dryrun === false) {
    if (!fs.existsSync(`${projectRoot}/.eslintrc`)) {
      if (!projectPackage.eslintConfig) {
        projectPackage.eslintConfig = invigPackage.eslintConfig
      }
    }
  }

  scrolex.out('Adding babel project config', { components: `invig>${projectRootRel}>toEs6` })
  if (program.dryrun === false) {
    if (!fs.existsSync(`${projectRoot}/.babelrc`)) {
      if (!projectPackage.babel) {
        projectPackage.babel = invigPackage.babel
      }
    }
  }

  scrolex.out('Writing eslint ignores', { components: `invig>${projectRootRel}>toJs` })
  if (program.dryrun === false) {
    if (!fs.existsSync(`${projectRoot}/.eslintignore`)) {
      fs.writeFileSync(`${projectRoot}/.eslintignore`, 'utf-8', fs.readFileSync(`${invigRoot}/.eslintignore`, 'utf-8'))
    }
  }

  scrolex.out('Writing back project config ', { components: `invig>${projectRootRel}>init` })
  fs.writeFileSync(projectPackagePath, JSON.stringify(projectPackage, null, 2), 'utf-8')

  return cb(null)
}

const toJs = (srcPath, cb) => {
  const cmd = `${npmBinDir}/decaffeinate --keep-commonjs --prefer-const --loose-default-params ${srcPath}`
  scrolex.exe(cmd, scrolexOpts({ components: `invig>${srcPath}>toJs` }), cb)
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

  scrolex.exe(cmd, scrolexOpts({ components: `invig>${srcPath}>toEs6` }), cb)
}

const toPrettier = (srcPath, cb) => {
  const cmd = `${npmBinDir}/prettier --write ${srcPath} --fix ${srcPath}`
  scrolex.exe(cmd, scrolexOpts({ components: `invig>${srcPath}>toPrettier` }), cb)
}

const toEslintStandard = (srcPath, cb) => {
  const cmd = `${npmBinDir}/eslint --fix ${srcPath}`
  scrolex.exe(cmd, scrolexOpts({ components: `invig>${srcPath}>toEslintStandard` }), cb)
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

let files = []
let relative
if (fs.lstatSync(program.src).isFile()) {
  // File
  relative = path.relative(process.cwd(), program.src)
  files    = [ relative ]
} else if (fs.lstatSync(program.src).isDirectory()) {
  // Directory
  relative = path.relative(process.cwd(), program.src)
  files    = globby.sync([
    `${relative}/**/*.js`,
    `${relative}/**/*.coffee`,
    `${relative}/**/*.es5`,
    `${relative}/**/*.es6`,
  ])
} else {
  // Pattern
  files = globby.sync(program.src)
}

if (!files || files.length === 0) {
  console.error(`Source argument: "${program.src}" returned no input files to work on.`)
  process.exit(1)
}

initProject(pkgUp.sync(path.dirname(files[0])), (err) => {
  if (err) {
    console.error(`Error while doing project init. ${err}`)
    process.exit(1)
  }
  debug({files})
  const q = queue(convertFile, program.concurrency)
  q.push(files)
  q.drain = () =>
    console.log('Done. ')
})
