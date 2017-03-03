# DAGger

A CLI tool for creating internal dependency graphs of Node.js projects.

## Requirements

* Node.js with ES6 support (tested with Node 6)
* A modern web browser (tested with Firefox and Chrome)

## Quick Start

To create the dependency graph for a given project, try:

    $ npm install -g dagger
    $ dagger --html graph.html path/to/project/index

To use Dagger inside of a project, try:

    $ npm install --save dagger

Then use `dagger.require` on the root of the project.

```
const dagger = require('dagger')
// This behaves exactly like a regular `require` does.
const dependencies = dagger.require('./index')
for (let dependency of dependencies) {
  console.log(`${dependency.parent} depends on ${dependency.module}`)
}
```

Then open `graph.html` (which will be in the current directory in the above example).

## Known Limitations

We currently don't support recording delayed `require`s. For example, if a module is `require`d in a callback or promise, it won't get recorded.

```
// This will not get recorded by Dagger.
setTimeout(() => {
  require('./db')
}, 0)
```

## TODO

- [] Add screenshots.
