'use strict'

// This file lets you record all `requires` that stem from one `require`.
// e.g. To see what `require('./server.js')` would actually require, call `spy('./server.js')`

// `let`, not `const` because we're mutating it.
let Module = require('module')
const path = require('path')

// Some things we'll restore later.
const originalLoad = Module._load
const originalExit = process.exit

/**
 * Detect if an import looks like it's from another node module.
 *
 * These tend to be in a `node_modules` folder or not end with `.js`.
 */
function looksLikeThirdParty (parentRelativePath, moduleRelativePath) {
  return !moduleRelativePath.endsWith('.js') ||
      moduleRelativePath.includes('node_modules') ||
      parentRelativePath.includes('node_modules')
}

function hijackLoad (visitor) {
  Module._load = function (request, parent, isMain) {
    const exports = originalLoad.apply(Module, arguments)
    const parentFullPath = parent.filename
    const moduleFullPath = Module._resolveFilename(request, parent)

    visitor(parentFullPath, moduleFullPath)
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

exports.require = function (entryPoint, showNodeModules) {
  let dependencies = []

  const basePath = path.dirname(path.resolve(getCallerDirectory(), entryPoint))

  let toBePurged = new Set()

  hijackLoad(function visitor (parentPath, modulePath) {
    if (!showNodeModules && looksLikeThirdParty(parentPath, modulePath)) {
      return
    }
    toBePurged.add(modulePath)

    const parentRelativePath = path.relative(basePath, parentPath)
    const moduleRelativePath = path.relative(basePath, modulePath)

    // Make all paths, even on Windows, use forward slashes.
    dependencies.push({
      parent: parentRelativePath.split(path.sep).join('/'),
      module: moduleRelativePath.split(path.sep).join('/')
    })
  })

  return new Promise(function (resolve, reject) {
    process.exit = function () {
      console.warn('Hijacked exit called!')
      // Something requested that we exit, so return the dependency graph first.
      resolve(dependencies)
    }

    try {
      require(path.resolve(getCallerDirectory(), entryPoint))
    } finally {
      // Undo the damage no matter what happens.
      Module._load = originalLoad
      process.exit = originalExit

      for (let cachedFile of toBePurged) {
        delete require.cache[cachedFile]
      }
    }

    // Get rid of the last known dependency because that is this file requiring the entry point.
    dependencies.pop()
    resolve(dependencies)
  })
}
