'use strict'

// This file lets you record all `requires` that stem from one `require`.
// e.g. To see what `require('./server.js')` would actually require, call `spy('./server.js')`

// `let`, not `const` because we're mutating it.
let Module = require('module')
const path = require('path')

// Some things we'll restore later.
const originalLoad = Module._load
const originalExit = process.exit
const originalCwd = path.resolve(process.cwd())

/**
 * Detect if an import looks like it's from another node module.
 *
 * These tend to be in a `node_modules` folder or not end with `.js`.
 */
function looksLikeThirdParty (parentRelativePath, moduleRelativePath) {
  return !moduleRelativePath.endsWith('.js') ||
      moduleRelativePath.startsWith('node_modules') ||
      parentRelativePath.startsWith('node_modules')
}

function hijackLoad (basePath, visitor) {
  Module._load = function (request, parent, isMain) {
    const exports = originalLoad.apply(Module, arguments)
    const parentFullPath = parent.filename
    const moduleFullPath = Module._resolveFilename(request, parent)

    const parentRelativePath = path.relative(basePath, parentFullPath)
    const moduleRelativePath = path.relative(basePath, moduleFullPath)

    delete require.cache[moduleFullPath]
    visitor(parentRelativePath, moduleRelativePath)

    return exports
  }
}

function getCallerDirectory () {
  const originalStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack
  const err = new Error()
  const stack = err.stack
  Error.prepareStackTrace = originalStackTrace

  let currentFile = stack.shift().getFileName()
  let callerFile
  while (stack.length > 0) {
    callerFile = stack.shift().getFileName()
    // When the filename changes, we've made it to the file that called this.
    if (currentFile !== callerFile) {
      break
    }
  }

  return path.dirname(callerFile)
}

exports.require = function (entryPoint, hideNodeModules) {
  let dependencies = []

  const basePath = path.dirname(entryPoint)

  hijackLoad(basePath, function visitor (parentPath, modulePath) {
    if (!hideNodeModules || !looksLikeThirdParty(parentPath, modulePath)) {
      // Make all paths, even on Windows, use forward slashes.
      dependencies.push({
        parent: parentPath.split(path.sep).join('/'),
        module: modulePath.split(path.sep).join('/')
      })
    }
  })

  return new Promise(function (resolve, reject) {
    process.exit = function () {
      console.warn('Hijacked exit called!')
      // Something requested that we exit, so return the dependency graph first.
      resolve(dependencies)
    }

    try {
      process.chdir(getCallerDirectory())
      require(path.resolve(entryPoint))
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
