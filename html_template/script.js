/* globals cytoscape, dependencies */
const container = document.getElementById('container')
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

const cy = cytoscape({
  container: container,
  elements: {
    nodes: Array.from(nodes),
    edges: Array.from(edges)
  },
  layout: {
    name: 'grid',
    directed: true
  },
  style: [{
    selector: 'node',
    style: {
      'content': 'data(id)',
      'text-opacity': 0.8,
      'text-valign': 'center',
      'text-halign': 'right',
      'background-color': '#11479e'
    }
  }, {
    selector: 'edge',
    style: {
      'width': 4,
      'target-arrow-shape': 'triangle',
      'line-color': '#9dbaea',
      'target-arrow-color': '#9dbaea',
      'curve-style': 'bezier'
    }
  }]
})
console.log(cy)
