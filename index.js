const fs = require('fs')
const path = require('path')

const spy = require('./spy')

const ENTRY = '../PillPal/server'
// const ENTRY = './sample/entry'
const HEADER = 'const dependencies = '

spy.spy(ENTRY, true)
.then(dependencies => {
  for (dep of dependencies) {
    // Shorten names for graph representation.
    dep.module = path.basename(dep.module, '.js')
    dep.parent = path.basename(dep.parent, '.js')
    console.log(dep)
  }




  const jsonData = JSON.stringify(dependencies, null, 2)
  fs.writeFileSync('./output/data.js', HEADER + jsonData)
})
