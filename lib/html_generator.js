'use strict'
// Minimal library for generating a single HTML page that renders a graph.
const fs = require('fs')

const cytoscape = require('cytoscape')

// I refuse to import a whole package for this.
function sprintf (format) {
  var args = Array.prototype.slice.call(arguments, 1)
  return format.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number] : match
  })
}

function generateElements (dependencies) {
  let nodes = new Set()
  let edges = new Set()
  for (let dependency of dependencies) {
    nodes.add({data: {
      id: dependency.module
    }})
    nodes.add({data: {
      id: dependency.parent
    }})
    edges.add({data: {
      id: dependency.parent + dependency.module,
      source: dependency.parent,
      target: dependency.module
    }})
  }

  return {
    nodes: Array.from(nodes),
    edges: Array.from(edges)
  }
}

function toposort (cy, root) {
  cy.elements().dfs({
    roots: `#${escape(root)}`,
    visit: function (i, depth, v) {
      v.data('topo', i)
    },
    directed: true
  })
}

function escape (s) {
  return s.replace('.', '\\.').replace('/', '\\/')
}

function markCyclicVertices (cy) {
  cy.elements().edges().forEach(edge => {
    const sourceIndex = edge.source().data('topo')
    const targetIndex = edge.target().data('topo')

    if (targetIndex < sourceIndex) {
      // This is a back edge so mark the source as "bad".
      edge.source().data('cyclic', true)
    }
  })
}

function makeGraphJson (dependencies) {
  const elements = generateElements(dependencies)

  const cy = cytoscape({
    elements: elements
  })

  if (dependencies.length > 0) {
    toposort(cy, dependencies[0].parent)
    markCyclicVertices(cy)
  }

  return JSON.stringify(cy.json())
}

exports.generate = function (dependencies) {
  const graphJson = makeGraphJson(dependencies)

  const htmlTemplate = fs.readFileSync('./html_template/index.tmpl.html').toString()
  const htmlData = sprintf(htmlTemplate, graphJson)
  return htmlData
}
