/* globals vis, dependencies */
let labelMaps = {}
let nodes = []
let edges = []

for (let dependency of dependencies) {
  if (labelMaps[dependency.parent] === undefined) {
    labelMaps[dependency.parent] = nodes.length
    nodes.push({
      id: nodes.length,
      label: dependency.parent
    })
  }

  if (labelMaps[dependency.module] === undefined) {
    labelMaps[dependency.module] = nodes.length
    nodes.push({
      id: nodes.length,
      label: dependency.module
    })
  }
  edges.push({
    from: labelMaps[dependency.parent],
    to: labelMaps[dependency.module]
  })
}

const container = document.getElementById('container')
const data = {
  nodes: new vis.DataSet(nodes),
  edges: new vis.DataSet(edges)
}

const options = {
  layout: {
    // hierarchical: {
    //   enabled: false,
    //   parentCentralization: true,
    //   direction: 'UD',
    //   sortMethod: 'hubsize',
    //   edgeMinimization: true
    // }
    randomSeed: 0
  },
  edges: {
    arrows: 'to',
    smooth: false
  },
  physics: {
    enabled: true,
    hierarchicalRepulsion: {
      centralGravity: 0.0,
      springLength: 300,
      springConstant: 0.01,
      nodeDistance: 200,
      damping: 0.09
    },
    solver: 'hierarchicalRepulsion'
  }
}

const network = new vis.Network(container, data, options)
const patientId = labelMaps['patient']
network.setSelection({nodes: [patientId]})
const patientPosition = network.getPositions([patientId])[patientId]
setTimeout(() => {
  network.moveTo({
    position: patientPosition,
    scale: 2,
    offset: {x: 0, y: 0},
    animation: false
    // offset: {x: window.innerWidth / 2, y: window.innerHeight / 2}
  })
  setTimeout(() => {
    network.fit()
  }, 1000)
}, 1000)


// network.fit()
