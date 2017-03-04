/* globals describe, it */
const Module = require('module')

const expect = require('chai').expect

const cyclic = require('../cyclic')

describe('cyclic.js#require cleanup', function () {
  it('Restores `require` after the promise resolves.', function (done) {
    const originalRequire = require
    const originalLoad = Module._load

    cyclic.require('./samples/basic/a')
    .then(() => {
      expect(require).to.equal(originalRequire)
      expect(originalLoad).to.equal(Module._load)
      done()
    }).catch(done)
  })

  it('Restores `process.exit` after the promise resolves.', function (done) {
    const originalProcessExit = process.exit
    cyclic.require('./samples/basic/a')
    .then(() => {
      expect(process.exit).to.equal(originalProcessExit)
      done()
    }).catch(done)
  })

  it('Restores `process.cwd()` after the promise resolves.', function (done) {
    const originalCwd = process.cwd()
    cyclic.require('./samples/basic/a')
    .then(() => {
      expect(process.cwd()).to.equal(originalCwd)
      done()
    }).catch(done)
  })

  it('Gracefully returns when `process.exit` is called.', function (done) {
    const originalProcessExit = process.exit
    const expectedDependencies = [{
      parent: 'a.js',
      module: 'b.js'
    }]
    cyclic.require('./samples/exit/a')
    .then(dependencies => {
      // `process.exit` should be still be restored.
      expect(process.exit).to.equal(originalProcessExit)
      expect(dependencies).to.deep.equal(expectedDependencies)
      done()
    })
    .catch(done)
  })
})
