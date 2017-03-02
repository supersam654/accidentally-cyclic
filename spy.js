'use strict'

// `let`, not `const` because we're mutating it.
let Module = require('module')
const path = require('path')

const originalLoad = Module._load
const originalExit = process.exit
const originalCwd = path.resolve(process.cwd())

function looksLikeThirdParty (parentRelativePath, moduleRelativePath) {
  return !moduleRelativePath.endsWith('.js')
  || moduleRelativePath.startsWith('node_modules')
  || parentRelativePath.startsWith('node_modules')
}

exports.spy = function (entryPoint, hideNodeModules) {
  let dependencies = []
  const basePath = path.dirname(entryPoint)
  Module._load = function (request, parent, isMain) {
    const exports = originalLoad.apply(Module, arguments)
    delete require.cache[request]

    const parentFullPath = parent.filename
    const moduleFullPath = Module._resolveFilename(request, parent)


    const parentRelativePath = path.relative(basePath, parentFullPath)
    const moduleRelativePath = path.relative(basePath, moduleFullPath)

    if (!hideNodeModules || !looksLikeThirdParty(parentRelativePath, moduleRelativePath)) {
      // Make all paths, even on Windows, use forward slashes.
      dependencies.push({
        parent: parentRelativePath.split(path.sep).join('/'),
        module: moduleRelativePath.split(path.sep).join('/')
      })
    }

    return exports
  }

  return new Promise(function (resolve, reject) {
    process.exit = function () {
      console.warn('Hijacked exit called!')
      dependencies.pop()
      // Something requested that we exit, so return the dependency graph first.
      resolve(dependencies)
    }

    try {
      console.warn(path.resolve(path.dirname(entryPoint)))
      process.chdir(path.resolve(path.dirname(entryPoint)))
      require(entryPoint)
    } catch (e) {
      console.warn('Something went wrong when requiring the entry point.')
      console.warn(e)
    } finally {
      // Undo the damage no matter what happens.
      Module._load = originalLoad
      process.exit = originalExit
      process.chdir(originalCwd)
    }

    // Get rid of the last known dependency because that is this file requiring the entry point.
    dependencies.pop()
    resolve(dependencies)
  })


}
