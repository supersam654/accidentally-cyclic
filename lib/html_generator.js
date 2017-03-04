'use strict'
// Minimal library for generating a single HTML page that renders a graph.
const fs = require('fs')
const path = require('path')

const cytoscape = require('cytoscape')

// I refuse to import a whole package for this.
function sprintf (format) {
  var args = Array.prototype.slice.call(arguments, 1)
  return format.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number] : match
  })
}

/**
 * Represent a list of dependencies as nodes and edges for Cytoscape.
 *
 * @param dependencies An array of dependencies of the form `{parent: String, module: String}`.
 * @return An object of the form `{nodes: [node], edges: [edge]}`.
 */
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

/**
 * Topologically sort a Cytoscape graph.
 *
 * Sets the data `{topo: i}` on every vertex where `i` is the index in the topological sort.
 *
 * @param cy The graph to sort.
 * @param root The ID of the root of the graph (the original call to `require`).
 */
function toposort (cy, root) {
  cy.elements().dfs({
    roots: `#${escape(root)}`,
    visit: function (i, depth, v) {
      v.data('topo', i)
    },
    directed: true
  })
}

/**
 * Escape strings so Cytoscape accepts them.
 *
 * @param s The string to escape for Cytoscape.
 * @return A string that Cytoscape will accept as an ID.
 */
function escape (s) {
  return s.replace('.', '\\.').replace('/', '\\/')
}

/**
 * Add the data `{cyclic: true}` to every vertex with a backedge.
 *
 * Requires all vertices to have been topologically sorted already.
 *
 * @param cy A Cytoscape graph that has been topologically sorted.
 */
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

/**
 * Export a Cytoscape graph as JSON.
 *
 * Import it with `cy.json(jsonData)`.
 *
 * @param dependencies The list of dependencies to put in the graph.
 */
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

/**
 * Generate an HTML page (as a string) which loads a dependency graph.
 *
 * @param dependencies A list of dependencies to render as an interactive graph.
 * @return The HTML markup (that should probably be saved to an html file).
 */
exports.generate = function (dependencies) {
  const graphJson = makeGraphJson(dependencies)

  const templateFilename = path.resolve(__dirname, '..', 'html_template', 'index.tmpl.html')
  const htmlTemplate = fs.readFileSync(templateFilename).toString()
  const htmlData = sprintf(htmlTemplate, graphJson)
  return htmlData
}
