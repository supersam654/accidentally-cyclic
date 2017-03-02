const fs = require('fs')
const path = require('path')

const ArgumentParser = require('argparse').ArgumentParser

const spy = require('./spy')

const ENTRY = './sample/entry'

function parseArguments () {
  const parser = new ArgumentParser({
    version: require('./package.json').version,
    addHelp: true,
    description: 'Create internal dependency graph of Node.js project.'
  })

  parser.addArgument(
    ['-j', '--json'],
    {
      help: 'Output dependencies directly as a JSON array to a file'
    }
  )
  parser.addArgument(
    ['-q', '--quiet'],
    {
      action: 'storeTrue',
      help: 'Silence standard out of the required file'
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

function main () {
  const HEADER = 'const dependencies = '
  const args = parseArguments()
  console.log(args)

  spy.spy(ENTRY, !args.all, args.quiet)
  .then(dependencies => {
    for (let dep of dependencies) {
      // Shorten names even more for graph representation.
      dep.module = path.basename(dep.module, '.js')
      dep.parent = path.basename(dep.parent, '.js')
      console.log(dep)
    }

    const jsonData = JSON.stringify(dependencies, null, 2)
    if (args.json) {
      fs.writeFileSync(args.json, jsonData)
    } else {
      fs.writeFileSync('./www/data.js', HEADER + jsonData)
    }
  })
}
main()
