#!/usr/bin/env node
const program         = require('commander')
const globby          = require('globby')
const applyEachSeries = require('async/applyEachSeries')
const queue           = require('async/queue')
const path            = require('path')
const fs              = require('fs')
const pkgUp           = require('pkg-up')
const scrolex         = require('scrolex')

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
  .option('-s, --src <dir>', "Directory or file to convert. DESTRUCTIVE. MAKE SURE IT'S UNDER SOURCE CONTROL. ")
  .option('-b, --bail', 'Abort on the first error instead of continuing to port the next file')
  .option('-c, --check', 'When done, run dependency check to see if there are unused or unupdated ones')
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

program.src    = untildify(program.src)
program.dryrun = !!program.dryrun
program.bail   = !!program.bail

scrolex.persistOpts({
  announce             : true,
  addCommandAsComponent: true,
  components           : `invig`,
  mode                 : process.env.SCROLEX_MODE || 'singlescroll',
  shell                : true,
  fatal                : program.bail,
  dryrun               : program.dryrun,
})

const initProject = (projectPackagePath, cb) => {
  const projectPackage  = require(projectPackagePath)
  const projectRoot     = path.dirname(projectPackagePath)
  const projectRootRel  = path.relative(process.cwd(), projectRoot) || '.'
  const invigRoot       = `${__dirname}/..`
  // const invigRootRel = path.relative(process.cwd(), invigRoot)
  const invigPackage    = require(`${invigRoot}/package.json`)
  let npmInstallNeeded  = []

  scrolex.stick('Adding npm task project config', { components: `invig>${projectRootRel}` })
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

  scrolex.stick('Adding dependencies task project config', { components: `invig>${projectRootRel}` })
  if (program.dryrun === false) {
    if (!projectPackage.dependencies) {
      projectPackage.dependencies = {}
    }
    if (!projectPackage.devDependencies) {
      projectPackage.devDependencies = {}
    }

    for (let name in invigPackage.dependencies) {
      if (name.match(/^(babel|eslint)/)) {
        if (projectPackage.devDependencies[name] !== invigPackage.dependencies[name]) {
          projectPackage.devDependencies[name] = invigPackage.dependencies[name]
          npmInstallNeeded.push(`Add ${name} to devDependencies`)
        }
      }
    }

    const removeDeps = ['coffee-script', 'coffeelint']
    removeDeps.forEach((name) => {
      if (projectPackage.dependencies[name]) {
        delete projectPackage.dependencies[name]
        npmInstallNeeded.push(`Remove ${name} from dependencies`)
      }
      if (projectPackage.devDependencies[name]) {
        delete projectPackage.devDependencies[name]
        npmInstallNeeded.push(`Remove ${name} from devDependencies`)
      }
    })
  }

  scrolex.stick('Writing eslint project config', { components: `invig>${projectRootRel}` })
  if (program.dryrun === false) {
    copySyncNoOverwrite(`${invigRoot}/.eslintrc`, `${projectRoot}/.eslintrc`)
  }

  scrolex.stick('Writing babel project config', { components: `invig>${projectRootRel}` })
  if (program.dryrun === false) {
    copySyncNoOverwrite(`${invigRoot}/.babelrc`, `${projectRoot}/.babelrc`)
  }

  scrolex.stick('Writing eslint ignores', { components: `invig>${projectRootRel}` })
  if (program.dryrun === false) {
    copySyncNoOverwrite(`${invigRoot}/.eslintignore`, `${projectRoot}/.eslintignore`)
  }

  scrolex.stick('Writing back project config ', { components: `invig>${projectRootRel}` })
  fs.writeFileSync(projectPackagePath, JSON.stringify(projectPackage, null, 2), 'utf-8')

  if (npmInstallNeeded.length > 0) {
    scrolex.stick('Running npm install to accomodate these changes: ' + npmInstallNeeded.join('. '), { components: `invig>${projectRootRel}` })
    const cmd = `yarn || npm install`
    scrolex.exe(cmd, { cwd: projectDir, components: `invig>${projectRootRel}` })
  } else {
    return cb(null)
  }
}

const toJs = (projectDir, srcPath, cb) => {
  const cmd = `${npmBinDir}/decaffeinate --allow-invalid-constructors --keep-commonjs --prefer-const --loose-default-params ${srcPath} && rm -f ${srcPath}`
  scrolex.exe(cmd, { cwd: projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` })
}

const toEs6 = (projectDir, srcPath, cb) => {
  srcPath = srcPath.replace(/\.coffee$/, '.js')
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

  scrolex.exe(cmd, { cwd: projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` }, cb)
}

const toPrettier = (projectDir, srcPath, cb) => {
  srcPath = srcPath.replace(/\.coffee$/, '.js')
  const cmd = `${npmBinDir}/prettier --single-quote --print-width 100 --write ${srcPath}`
  scrolex.exe(cmd, { cwd: projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` }, cb)
}

const toEslintStandard = (projectDir, srcPath, cb) => {
  srcPath = srcPath.replace(/\.coffee$/, '.js')
  const cmd = `${npmBinDir}/eslint --config ${projectDir}/.eslintrc --fix ${srcPath}`
  scrolex.exe(
    cmd,
    { cwd: projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` },
    cb
  )
}

const convertFile = (projectDir, srcPath, cb) => {
  const fns       = []
  const extension = path.extname(srcPath).toLowerCase()

  if (extension === '.coffee') {
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
// let relative
if (fs.lstatSync(program.src).isFile()) {
  // File
  const resolve = path.resolve(program.src)
  files   = [ resolve ]
} else if (fs.lstatSync(program.src).isDirectory()) {
  // Directory
  const resolve = path.resolve(program.src)
  files = globby.sync([
    `${resolve}/**/*.coffee`,
    `${resolve}/**/*.es5`,
    `${resolve}/**/*.es6`,
    `${resolve}/**/*.js`,
    `!${resolve}/node_modules/**`,
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

if (!projectPackagePath) {
  console.error(`No package.json found, unable to establish project root. `)
  process.exit(1)
}

const projectDir = path.dirname(projectPackagePath)

initProject(projectPackagePath, err => {
  if (err) {
    console.error(`Error while doing project init. ${err}`)
    process.exit(1)
  }
  const q = queue(convertFile.bind(convertFile, projectDir), program.concurrency)
  q.push(files)
  q.drain = () => {
    console.log('Done. ')

    if (program.check) {
      scrolex.exe(`${npmBinDir}/npm-check ${projectDir}`, { cwd: projectDir, components: `invig>${path.relative(process.cwd(), projectDir)}` }, (err, stdout) => {
        if (err) {
          return scrolex.failure(`Error: ${err}`)
        }
        scrolex.stick('Finished npm-check')
      })
    }
  }
})
