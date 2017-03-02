const fs = require('fs')
const path = require('path')

const spy = require('./spy')

const ENTRY = './sample/entry'
const HEADER = 'const dependencies = '

spy.spy(ENTRY, true)
.then(dependencies => {
  for (let dep of dependencies) {
    // Shorten names even more for graph representation.
    dep.module = path.basename(dep.module, '.js')
    dep.parent = path.basename(dep.parent, '.js')
    console.log(dep)
  }

  const jsonData = JSON.stringify(dependencies, null, 2)
  fs.writeFileSync('./www/data.js', HEADER + jsonData)
})
