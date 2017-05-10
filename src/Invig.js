const scrolex         = require('scrolex')
const globby          = require('globby')
const debug           = require('depurar')('invig')
const applyEachSeries = require('async/applyEachSeries')
const queue           = require('async/queue')
const waterfall       = require('async/waterfall')
const path            = require('path')
const fs              = require('fs')
const pkgUp           = require('pkg-up')

class Invig {
  constructor (opts = {}) {
    this.opts = opts
  }

  initProject (files, cb) {
    const projectPackage  = require(this._projectPackagePath)
    const projectRoot     = path.dirname(this._projectPackagePath)
    const projectRootRel  = path.relative(process.cwd(), projectRoot) || '.'
    const invigRoot       = `${__dirname}/..`
    // const invigRootRel = path.relative(process.cwd(), invigRoot)
    const invigPackage    = require(`${invigRoot}/package.json`)
    let npmInstallNeeded  = []

    scrolex.stick('Adding npm task project config', { components: `invig>${projectRootRel}` })
    if (this.opts.dryrun === false) {
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
        if (!projectPackage.scripts['build:watch']) {
          projectPackage.scripts['build:watch'] = 'babel src --watch --source-maps --out-dir lib'
        }
      }
    }

    scrolex.stick('Adding dependencies task project config', { components: `invig>${projectRootRel}` })
    if (this.opts.dryrun === false) {
      if (!projectPackage.dependencies) {
        projectPackage.dependencies = {}
      }
      if (!projectPackage.devDependencies) {
        projectPackage.devDependencies = {}
      }

      for (let name in invigPackage.dependencies) {
        if (name.match(/^(babel|eslint|es6-promise)/)) {
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
    if (this.opts.dryrun === false) {
      this.copySyncNoOverwrite(`${invigRoot}/.eslintrc`, `${projectRoot}/.eslintrc`)
    }

    scrolex.stick('Writing babel project config', { components: `invig>${projectRootRel}` })
    if (this.opts.dryrun === false) {
      this.copySyncNoOverwrite(`${invigRoot}/.babelrc`, `${projectRoot}/.babelrc`)
    }

    scrolex.stick('Writing eslint ignores', { components: `invig>${projectRootRel}` })
    if (this.opts.dryrun === false) {
      this.copySyncNoOverwrite(`${invigRoot}/.eslintignore`, `${projectRoot}/.eslintignore`)
    }

    scrolex.stick('Writing back project config ', { components: `invig>${projectRootRel}` })
    fs.writeFileSync(this._projectPackagePath, JSON.stringify(projectPackage, null, 2), 'utf-8')

    if (npmInstallNeeded.length > 0) {
      scrolex.stick('Running npm install to accomodate these changes: ' + npmInstallNeeded.join('. '), { components: `invig>${projectRootRel}` })
      const cmd = `yarn || npm install`
      scrolex.exe(cmd, { cwd: this._projectDir, components: `invig>${projectRootRel}` }, (err) => {
        return cb(err, files)
      })
    } else {
      return cb(null, files)
    }
  }

  toJs (srcPath, cb) {
    const cmd = `${this.opts.npmBinDir}/decaffeinate --loose-includes --loose-for-of --allow-invalid-constructors --keep-commonjs --prefer-const --loose-default-params ${srcPath} && rm -f ${srcPath}`
    scrolex.exe(cmd, { cwd: this._projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` }, cb)
  }

  toEs6 (srcPath, cb) {
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

    const moveCommandWin =  `move /y ${srcPath.replace(/\//g, '\\')}.es6 ${srcPath.replace(/\//g, '\\')}`
    const moveCommandOthers = `mv -f ${srcPath}.es6 ${srcPath}`
    const moveCommand = /^win/.test(process.platform) ? moveCommandWin : moveCommandOthers

    const cmd = `${this.opts.npmBinDir}/lebab --transform=${list} ${srcPath} --out-file ${srcPath}.es6 && ${moveCommand}`

    scrolex.exe(cmd, { cwd: this._projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` }, cb)
  }

  toPrettier (srcPath, cb) {
    srcPath = srcPath.replace(/\.coffee$/, '.js')
    const cmd = `${this.opts.npmBinDir}/prettier --single-quote --print-width 180 --write ${srcPath}`
    scrolex.exe(cmd, { cwd: this._projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` }, cb)
  }

  toEslintStandard (srcPath, cb) {
    srcPath = srcPath.replace(/\.coffee$/, '.js')
    const cmd = `${this.opts.npmBinDir}/eslint --config ${this._projectDir}/.eslintrc --fix ${srcPath}`
    scrolex.exe(
      cmd,
      { cwd: this._projectDir, components: `invig>${path.relative(process.cwd(), srcPath)}` },
      cb
    )
  }

  convertFile (srcPath, cb) {
    const fns       = []
    const extension = path.extname(srcPath).toLowerCase()

    if (extension === '.coffee') {
      fns.push(this.toJs.bind(this))
    }
    fns.push(this.toEs6.bind(this))
    fns.push(this.toPrettier.bind(this))
    fns.push(this.toEslintStandard.bind(this))

    applyEachSeries(fns, srcPath, cb)
  }

  findFiles (cb) {
    let files = []
    let stat  = {}
    try {
      stat = fs.lstatSync(this.opts.src)
    } catch (e) {
      stat = false
    }

    // let relative
    if (stat && stat.isFile()) {
      // File
      const resolve = path.resolve(this.opts.src)
      files = [ resolve ]
    } else if (stat && stat.isDirectory()) {
      // Directory
      const resolve = path.resolve(this.opts.src)
      files = globby.sync([
        `${resolve}/**/*.coffee`,
        `${resolve}/**/*.es5`,
        `${resolve}/**/*.es6`,
        `${resolve}/**/*.js`,
        `!${resolve}/node_modules/**`,
      ])
    } else {
      // Pattern
      files = globby.sync(this.opts.src)
    }
    if (!files || files.length === 0) {
      return cb(new Error(`Source argument: "${this.opts.src}" returned no input files to work on.`))
    }

    return cb(null, files)
  }

  copySyncNoOverwrite (src, dst) {
    if (!fs.existsSync(dst)) {
      fs.writeFileSync(dst, fs.readFileSync(src, 'utf-8'), 'utf-8')
    }
  }

  findProject (files, cb) {
    this._projectPackagePath = pkgUp.sync(path.dirname(files[0]))

    if (!this._projectPackagePath) {
      return cb(new Error(`No package.json found, unable to establish project root. `))
    }

    this._projectDir = path.dirname(this._projectPackagePath)
    return cb(null, files)
  }

  processFiles (files, cb) {
    const q = queue(this.convertFile.bind(this), this.opts.concurrency)
    q.push(files)
    q.drain = () => {
      return cb(null, files)
    }
  }

  upgradeDeps (files, cb) {
    if (this.opts.check) {
      scrolex.exe(`${this.opts.npmBinDir}/npm-check ${this._projectDir}`, { cwd: this._projectDir, components: `invig>${path.relative(process.cwd(), this._projectDir)}` }, (err, stdout) => {
        if (err) {
          return cb(err)
        }
        return cb(null)
      })
    } else {
      return cb(null)
    }
  }

  runOnStdIn (stdin, cb) {
    this._projectDir = `${__dirname}/..`
    const coffeePath = `${__dirname}/tmpFile.coffee`
    let jsPath       = `${__dirname}/tmpFile.js`

    fs.writeFileSync(`${coffeePath}`, stdin, 'utf-8')
    scrolex.persistOpts({ mode: 'silent' })

    this.toJs(coffeePath, (err) => {
      if (err) {
        // Assume this was a JS snippet on STDIN already
        fs.writeFileSync(`${jsPath}`, fs.readFileSync(`${coffeePath}`, 'utf-8'), 'utf-8')
      }
      this.convertFile(jsPath, (err) => {
        debug(err)
        process.stdout.write(fs.readFileSync(`${jsPath}`, 'utf-8'))
        try {
          fs.unlinkSync(`${jsPath}`)
          fs.unlinkSync(`${coffeePath}`)
        } catch (e) {
        }

        return cb(null)
      })
    })
  }

  runOnPattern (cb) {
    waterfall([
      this.findFiles.bind(this),
      this.findProject.bind(this),
      this.initProject.bind(this),
      this.processFiles.bind(this),
      this.upgradeDeps.bind(this),
    ], cb)
  }
}

module.exports = Invig
