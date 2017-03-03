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

function makeGraphJson (dependencies) {
  const elements = generateElements(dependencies)

  const cy = cytoscape({
    elements: elements
  })

  return JSON.stringify(cy.json())
}

exports.generate = function (dependencies) {
  const graphJson = makeGraphJson(dependencies)

  const htmlTemplate = fs.readFileSync('./html_template/index.tmpl.html').toString()
  const htmlData = sprintf(htmlTemplate, graphJson)
  return htmlData
}
