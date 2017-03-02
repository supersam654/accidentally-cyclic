#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const ArgumentParser = require('argparse').ArgumentParser

const dagger = require('../dagger')

// I refuse to import a whole package for this.
function sprintf (format) {
  var args = Array.prototype.slice.call(arguments, 1)
  return format.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number] : match
  })
}

function parseArguments () {
  const parser = new ArgumentParser({
    version: require('../package.json').version,
    addHelp: true,
    description: 'Create internal dependency graph of Node.js project.'
  })

  parser.addArgument(
    ['--json'],
    {
      help: 'Output dependencies directly as a JSON array to a file'
    }
  )
  parser.addArgument(
    ['--html'],
    {
      help: 'Output dependency graph to a self-contained HTML file'
    }
  )
  parser.addArgument(
    ['-a', '--all'],
    {
      action: 'storeTrue',
      help: 'Include dependencies from node_modules'
    }
  )
  parser.addArgument(
    'mainFile',
    {
      help: 'Entry file of the project to get dependencies for'
    }
  )
  return parser.parseArgs()
}

function main (args) {
  const mainFile = path.resolve(process.cwd(), args.mainFile)

  dagger.spy(mainFile, !args.all, args.quiet)
  .then(dependencies => {
    for (let dep of dependencies) {
      // Shorten names even more for graph representation.
      dep.module = path.basename(dep.module, '.js')
      dep.parent = path.basename(dep.parent, '.js')
      console.log(dep)
    }

    const jsonData = JSON.stringify(dependencies, null, 2)

    // Note that you can export as json and html if you so please.
    if (args.json) {
      fs.writeFileSync(args.json, jsonData)
    }
    if (args.html) {
      const htmlTemplate = fs.readFileSync('./html_template/index.tmpl.html').toString()
      const frontendJS = fs.readFileSync('./html_template/script.js').toString()
      const htmlData = sprintf(htmlTemplate, jsonData, frontendJS)
      fs.writeFileSync(args.html, htmlData)
    }
  })
  .catch(e => {
    console.warn(e)
  })
}

main(parseArguments())
