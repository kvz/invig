import scrolex from 'scrolex'
import globby from 'globby'
import path from 'path'
import pkgUp from 'pkg-up'
import lebab from 'lebab'
import fs from 'fs-extra'
import format from 'prettier-eslint'
import eslintConfig from '../.eslintrc'
import depurar from 'depurar'
import ncu from 'npm-check-updates'

const debug = depurar('invig')

class Invig {
  constructor (opts = {}) {
    this.opts = opts
  }

  async initProject () {
    try {
      const projectPackage = await fs.readJson(this._projectPackagePath, {
        throws: false,
      })
      const projectRoot = path.dirname(this._projectPackagePath)
      const projectRootRel = path.relative(process.cwd(), projectRoot) || '.'
      const invigRoot = `${__dirname}/..`
      // const invigRootRel = path.relative(process.cwd(), invigRoot)
      const invigPackage = await fs.readJson(`${invigRoot}/package.json`, { throws: false })
      let npmInstallNeeded = []

      scrolex.stick('Adding npm task project config', {
        components: `invig>${projectRootRel}`,
      })
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

      scrolex.stick('Adding dependencies task project config', {
        components: `invig>${projectRootRel}`,
      })
      if (this.opts.dryrun === false) {
        if (!projectPackage.dependencies) {
          projectPackage.dependencies = {}
        }
        if (!projectPackage.devDependencies) {
          projectPackage.devDependencies = {}
        }

        Object.keys(invigPackage.dependencies).forEach(name => {
          if (name.match(/^(babel|eslint|es6-promise)/)) {
            if (projectPackage.devDependencies[name] !== invigPackage.dependencies[name]) {
              projectPackage.devDependencies[name] = invigPackage.dependencies[name]
              npmInstallNeeded.push(`Add ${name} to devDependencies`)
            }
          }
        })

        const removeDeps = ['coffee-script', 'coffeelint']
        removeDeps.forEach(name => {
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

      scrolex.stick('Writing eslint project config', {
        components: `invig>${projectRootRel}`,
      })
      if (this.opts.dryrun === false) {
        this.copySyncNoOverwrite(`${invigRoot}/.eslintrc.js`, `${projectRoot}/.eslintrc.js`)
      }

      scrolex.stick('Writing babel project config', {
        components: `invig>${projectRootRel}`,
      })
      if (this.opts.dryrun === false) {
        this.copySyncNoOverwrite(`${invigRoot}/.babelrc`, `${projectRoot}/.babelrc`)
      }

      scrolex.stick('Writing eslint ignores', {
        components: `invig>${projectRootRel}`,
      })
      if (this.opts.dryrun === false) {
        this.copySyncNoOverwrite(`${invigRoot}/.eslintignore`, `${projectRoot}/.eslintignore`)
      }

      scrolex.stick('Writing back project config ', {
        components: `invig>${projectRootRel}`,
      })
      fs.writeFileSync(this._projectPackagePath, JSON.stringify(projectPackage, null, 2), 'utf-8')

      if (npmInstallNeeded.length > 0) {
        scrolex.stick(`Running npm install to accomodate these changes: ${npmInstallNeeded.join('. ')}`, {
          components: `invig>${projectRootRel}`,
        })
        const cmd = `yarn || npm install`
        scrolex.exe(cmd, { cwd: this._projectDir, components: `invig>${projectRootRel}` }, err => {
          if (err) throw err
        })
      } else {
        return
      }
    } catch (err) {
      throw err
    }
  }

  toJs (srcPath) {
    return new Promise((resolve, reject) => {
      scrolex.stick('Converting from coffee to js', {
        components: `invig>${srcPath}`,
      })
      const cmd = `${this.opts.npmBinDir}/decaffeinate \
      --no-array-includes \
      --loose-includes \
      --loose-for-of \
      --allow-invalid-constructors \
      --loose-default-params ${srcPath} && \
      rm -f ${srcPath}`
      scrolex.exe(
        cmd,
        {
          cwd       : this._projectDir,
          components: `invig>${path.relative(process.cwd(), srcPath)}`,
        },
        (err, result) => {
          if (err) reject(err)
          resolve(result)
        }
      )
    })
  }

  async transform (srcPath, args) {
    try {
      srcPath = srcPath.replace(/\.coffee$/, '.js')
      const sourceCode = await fs.readFile(srcPath, 'utf8')
      const { code } = lebab.transform(sourceCode, args)
      if (this.opts.dryrun) resolve()
      await fs.outputFile(srcPath, code)
    } catch (err) {
      throw err
    }
  }

  toEs6 (srcPath) {
    return new Promise((resolve, reject) => {
      scrolex.stick('Upgrading to Es6', { components: `invig>${srcPath}` })
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
      ]
      const unsafe = ['let', 'class', 'template', 'default-param', 'destruct-param']
      const list = [].concat(safe, unsafe)
      this.transform(srcPath, list).then(resolve).catch(reject)
    })
  }

  toEs7 (srcPath) {
    return new Promise((resolve, reject) => {
      scrolex.stick('Upgrading to Es7', { components: `invig>${srcPath}` })
      const safe = [
        'arrow',
        'for-of',
        'for-each',
        'arg-rest',
        'arg-spread',
        'obj-method',
        'obj-shorthand',
        'no-strict',
        'exponent',
        'multi-var',
      ]
      const unsafe = ['let', 'class', 'commonjs', 'template', 'default-param', 'destruct-param', 'includes']
      const list = [].concat(safe, unsafe)
      this.transform(srcPath, list).then(resolve).catch(reject)
    })
  }

  toPrettier (srcPath) {
    return new Promise(async (resolve, reject) => {
      scrolex.stick('Making Pretty', { components: `invig>${srcPath}` })
      srcPath = srcPath.replace(/\.coffee$/, '.js')
      const sourceCode = await fs.readFile(srcPath, 'utf8')
      const options = {
        text           : sourceCode,
        eslintConfig,
        prettierOptions: {
          bracketSpacing: true,
        },
        fallbackPrettierOptions: {
          singleQuote: true,
          printWidth : 120,
        },
      }
      const code = format(options)
      if (this.opts.dryrun) resolve()
      fs.outputFile(srcPath, code).then(resolve).catch(reject)
    })
  }

  async convertFile (srcPath) {
    const extension = path.extname(srcPath).toLowerCase()
    try {
      if (extension === '.coffee') {
        await this.toJs.bind(this)(srcPath)
      }
      if (this.opts.es7) {
        await this.toEs7.bind(this)(srcPath)
      } else {
        await this.toEs6.bind(this)(srcPath)
      }
      await this.toPrettier.bind(this)(srcPath)
    } catch (err) {
      throw err
    }
  }

  findFiles () {
    return new Promise((resolve, reject) => {
      let files = []
      let stat = {}
      try {
        stat = fs.lstatSync(this.opts.src)
      } catch (e) {
        stat = false
      }
      // let relative
      if (stat && stat.isFile()) {
        // File
        const resolve = path.resolve(this.opts.src)
        files = [resolve]
      } else if (stat && stat.isDirectory()) {
        // Directory
        const resolve = path.resolve(this.opts.src)
        files = globby.sync([`${resolve}/**/*.coffee`, `${resolve}/**/*.js`, `!${resolve}/node_modules/**`])
      } else {
        // Pattern
        files = globby.sync(this.opts.src)
      }
      if (!files || files.length === 0) {
        reject(new Error(`Source argument: "${this.opts.src}" returned no input files to work on.`))
      }
      resolve(files)
    })
  }

  copySyncNoOverwrite (src, dst) {
    if (!fs.existsSync(dst)) {
      fs.writeFileSync(dst, fs.readFileSync(src, 'utf-8'), 'utf-8')
    }
  }

  findProject (files) {
    return new Promise((resolve, reject) => {
      this._projectPackagePath = pkgUp.sync(path.dirname(files[0]))
      if (!this._projectPackagePath) {
        reject(new Error(`No package.json found, unable to establish project root. `))
      }
      this._projectDir = path.dirname(this._projectPackagePath)
      resolve()
    })
  }

  processFiles (files) {
    return new Promise((resolve, reject) => {
      Promise.all(files.map(this.convertFile.bind(this))).then(resolve).catch(reject)
    })
  }

  upgradeDeps () {
    return new Promise((resolve, reject) => {
      if (this.opts.check) {
        scrolex.stick('Checking installed packages', {
          components: `invig>package.json`,
        })
        ncu
          .run({
            packageFile: 'package.json',
            upgradeAll : true,
          })
          .then(upgraded => {
            let upgrades = ''
            Object.entries(upgraded).forEach(([key, val]) => {
              upgrades += ` ${key}@${val}`
            })
            const cmd = `yarn upgrade ${upgrades} || npm upgrade ${upgrades}`
            scrolex.exe(cmd, { cwd: this._projectDir, components: 'invig>package.json' }, err => {
              if (err) reject(err)
              resolve()
            })
          })
          .catch(reject)
      } else {
        resolve()
      }
    })
  }

  async runOnStdIn (stdin) {
    this._projectDir = `${__dirname}/..`
    const coffeePath = `${__dirname}/tmpFile.coffee`
    let jsPath = `${__dirname}/tmpFile.js`
    try {
      await fs.outputFile(coffeePath, stdin)
      scrolex.persistOpts({ mode: 'silent' })
      this.convertFile(jsPath).then(err => {
        debug(err)
        process.stdout.write(fs.readFileSync(jsPath, 'utf-8'))
        fs.unlinkSync(jsPath)
        fs.unlinkSync(coffeePath)
      })
    } catch (err) {
      throw err
    }
  }

  async runOnPattern () {
    try {
      const files = await this.findFiles.bind(this)()
      await this.findProject.bind(this)(files)
      await this.initProject.bind(this)()
      await this.processFiles.bind(this)(files)
      await this.upgradeDeps.bind(this)()
    } catch (err) {
      throw err
    }
  }
}

export default Invig
