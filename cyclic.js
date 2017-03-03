'use strict'

// This file lets you record all `requires` that stem from one `require`.

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
function looksLikeThirdParty (parentPath, modulePath) {
  return !modulePath.endsWith('.js') ||
      modulePath.includes('node_modules') ||
      parentPath.includes('node_modules')
}

function isModule (importName) {
  return !importName.startsWith('.') && !path.isAbsolute(importName)
}

function hijackLoad (visitor) {
  Module._load = function (request, parent, isMain) {
    const exports = originalLoad.apply(Module, arguments)
    const parentFullPath = parent.filename
    const moduleFullPath = Module._resolveFilename(request, parent)
    visitor(parentFullPath, moduleFullPath, request)
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

function simplifyNames (originalRequest, dependencies, showNodeModules) {
  const basePath = path.dirname(Module._resolveFilename(originalRequest, module))
  const baseIsModule = isModule(originalRequest)
  let simplifiedDependencies = []
  // Make all paths, even on Windows, use forward slashes.
  for (let dependency of dependencies) {
    let parentPath = path.relative(basePath, dependency.parent).split(path.sep).join('/')
    let modulePath
    if (isModule(dependency.request)) {
      // Use the value passed into `require`.
      modulePath = dependency.request
    } else {
      // Use the path that the `require` got resolved into.
      modulePath = path.relative(basePath, dependency.module).split(path.sep).join('/')
    }

    if (!showNodeModules && looksLikeThirdParty(parentPath, modulePath)) {
      // Skip because this is obviously a node_module and we are supposed to skip those.
      continue
    }

    if (!showNodeModules && baseIsModule && modulePath.startsWith('..')) {
      // Skip because we originally imported an external module (which is in a node_modules) folder.
      // This dependency is in a sibling directory so it is a different module.
      continue
    }
    simplifiedDependencies.push({
      parent: parentPath,
      module: modulePath
    })
  }

  return simplifiedDependencies
}

exports.require = function (entryPoint, showNodeModules) {
  // Fix relative paths
  // Don't touch absolute paths, core modules, and node_modules.
  if (entryPoint.startsWith('.')) {
    entryPoint = path.resolve(getCallerDirectory(), entryPoint)
  }

  let dependencies = []

  hijackLoad(function visitor (parentPath, modulePath, request) {
    dependencies.push({
      parent: parentPath,
      module: modulePath,
      request: request
    })
  })

  return new Promise(function (resolve, reject) {
    process.exit = function () {
      console.warn('Hijacked exit called!')
      // Something requested that we exit, so return the dependency graph first.
      dependencies = simplifyNames(dependencies)
      resolve(dependencies)
    }

    let originalCache
    try {
      originalCache = require.cache
      for (let key of Object.keys(require.cache)) {
        delete require.cache[key]
      }
      require(entryPoint)
    } finally {
      // Undo the damage no matter what happens.
      Module._load = originalLoad
      process.exit = originalExit
      require.cache = originalCache
    }

    dependencies = simplifyNames(entryPoint, dependencies, showNodeModules)

    // Get rid of the last known dependency because that is this file requiring the entry point.
    dependencies.pop()
    resolve(dependencies)
  })
}
