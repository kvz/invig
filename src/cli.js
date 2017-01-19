#!/usr/bin/env node
const program         = require('commander')
const globby          = require('globby')
const applyEachSeries = require('async/applyEachSeries')
const queue           = require('async/queue')
const path            = require('path')
const fs              = require('fs')
const Scrolex         = require('scrolex')
const debug           = require('depurar')('invig')
const pkgUp           = require('pkg-up')

const rootDir   = path.dirname(pkgUp.sync(__filename))
const npmDir    = `${rootDir}/node_modules`
const npmBinDir = `${npmDir}/.bin`
const untildify = require('untildify')

const copySyncNoOverwrite = (src, dst) => {
  if (!fs.existsSync(dst)) {
    fs.writeFileSync(dst, fs.readFileSync(src, 'utf-8'), 'utf-8')
  }
}

program
  .version(require('../package.json').version)
  .option(
    '-s, --src <dir>',
    "Directory or file to convert. DESTRUCTIVE. MAKE SURE IT'S UNDER SOURCE CONTROL. "
  )
  .option('-d, --dryrun', 'Wether to execute commands or just output them')
  .parse(process.argv)

if (!program.src) {
  console.error('You should provide at least a --src <dir> argument')
  process.exit(1)
}
if (!program.concurrency) {
  program.concurrency = 1
}
if (!program.init) {
  program.init = false
}

program.src = untildify(program.src)
program.dryrun = !!program.dryrun

const scrolexOpts = opts => {
  const defaultOpts    = {}
  defaultOpts.mode     = 'singlescroll'
  // defaultOpts.mode     = 'passthru'
  // defaultOpts.announce = true
  defaultOpts.shell    = true
  defaultOpts.fatal    = true
  if (program.dryrun === true) {
    defaultOpts.announce = true
    defaultOpts.dryrun   = true
  }
  return Object.assign({}, defaultOpts, opts)
}

const initProject = (projectPackagePath, cb) => {
  const projectPackage  = require(projectPackagePath)
  const projectRoot     = path.dirname(projectPackagePath)
  const projectRootRel  = path.relative(process.cwd(), projectRoot)
  const invigRoot       = `${__dirname}/..`
  // const invigRootRel = path.relative(process.cwd(), invigRoot)
  const invigPackage    = require(`${invigRoot}/package.json`)

  Scrolex.out('Adding npm task project config', scrolexOpts({ components: `invig>${projectRootRel}>npm` }))
  if (program.dryrun === false) {
    if (!projectPackage.scripts) {
      projectPackage.scripts = {}
    }
    if (!projectPackage.scripts.lint) {
      projectPackage.scripts.lint = 'eslint .'
    }
    if (!projectPackage.scripts.fix) {
      projectPackage.scripts.fix = 'eslint . --fix'
    }
    if (!projectPackage.scripts.build) {
      projectPackage.scripts.build = 'babel src --source-maps --out-dir lib'
    }
    if (!projectPackage.scripts['build:watch']) {
      projectPackage.scripts['build:watch'] = 'babel src --watch --source-maps --out-dir lib'
    }
  }

  Scrolex.out('Adding dependencies task project config', scrolexOpts({ components: `invig>${projectRootRel}>npm` }))
  if (program.dryrun === false) {
    if (!projectPackage.devDependencies) {
      projectPackage.devDependencies = {}
    }

    for (let name in invigPackage.devDependencies) {
      if (name.match(/^(babel|eslint)/)) {
        projectPackage.devDependencies[name] = invigPackage.devDependencies[name]
      }
    }
  }

  Scrolex.out('Writing eslint project config', scrolexOpts({ components: `invig>${projectRootRel}>toEslintStandard` }))
  if (program.dryrun === false) {
    copySyncNoOverwrite(`${invigRoot}/.eslintrc`, `${projectRoot}/.eslintrc`)
  }

  Scrolex.out('Writing babel project config', scrolexOpts({ components: `invig>${projectRootRel}>toEs6` }))
  if (program.dryrun === false) {
    copySyncNoOverwrite(`${invigRoot}/.babelrc`, `${projectRoot}/.babelrc`)
  }

  Scrolex.out('Writing eslint ignores', scrolexOpts({ components: `invig>${projectRootRel}>toJs` }))
  if (program.dryrun === false) {
    copySyncNoOverwrite(`${invigRoot}/.eslintignore`, `${projectRoot}/.eslintignore`)
  }

  Scrolex.out('Writing back project config ', scrolexOpts({ components: `invig>${projectRootRel}>init` }))
  fs.writeFileSync(projectPackagePath, JSON.stringify(projectPackage, null, 2), 'utf-8')

  return cb(null)
}

const toJs = (projectDir, srcPath, cb) => {
  const cmd = `${npmBinDir}/decaffeinate --keep-commonjs --prefer-const --loose-default-params ${srcPath}`
  Scrolex.exe(cmd, scrolexOpts({ cwd: projectDir, components: `invig>${srcPath}>toJs` }), cb)
}

const toEs6 = (projectDir, srcPath, cb) => {
  const safe = [
    'arrow',
    'for-of',
    'for-each',
    'arg-rest',
    'arg-spread',
    'obj-method',
    'obj-shorthand',
    'no-strict',
    // 'commonjs',
    // 'exponent',
    'multi-var',
  ]
  const unsafe = [
    'let',
    'class',
    'template',
    'default-param',
    // 'includes'
    'destruct-param',
  ]

  const list = [].concat(safe, unsafe).join(',')
  const cmd = `${npmBinDir}/lebab --transform=${list} ${srcPath} --out-file ${srcPath}.es6 && mv -f ${srcPath}.es6 ${srcPath} && echo lebabed`

  Scrolex.exe(cmd, scrolexOpts({ cwd: projectDir, components: `invig>${srcPath}>toEs6` }), cb)
}

const toPrettier = (projectDir, srcPath, cb) => {
  const cmd = `${npmBinDir}/prettier --single-quote --print-width 100 --write ${srcPath}`
  Scrolex.exe(cmd, scrolexOpts({ cwd: projectDir, components: `invig>${srcPath}>toPrettier` }), cb)
}

const toEslintStandard = (projectDir, srcPath, cb) => {
  const cmd = `${npmBinDir}/eslint --config ${projectDir}/.eslintrc --fix ${srcPath}`
  Scrolex.exe(
    cmd,
    scrolexOpts({ cwd: projectDir, components: `invig>${srcPath}>toEslintStandard` }),
    cb
  )
}

const convertFile = (projectDir, srcPath, cb) => {
  const fns       = []
  const extension = path.extname(srcPath).toLowerCase()
  if (extension === 'coffee') {
    fns.push(toJs.bind(toJs, projectDir))
  }
  fns.push(toEs6.bind(toEs6, projectDir))
  if (process.env.INVIG_PRETTIER === '1') {
    fns.push(toPrettier.bind(toPrettier, projectDir))
  }
  fns.push(toEslintStandard.bind(toEslintStandard, projectDir))

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

const projectPackagePath = pkgUp.sync(path.dirname(files[0]))
const projectDir         = path.dirname(projectPackagePath)

initProject(projectPackagePath, err => {
  if (err) {
    console.error(`Error while doing project init. ${err}`)
    process.exit(1)
  }
  debug({ files })
  const q = queue(convertFile.bind(convertFile, projectDir), program.concurrency)
  q.push(files)
  q.drain = () => console.log('Done. ')
})
