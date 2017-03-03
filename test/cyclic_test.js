/* globals describe, it */
const path = require('path')

const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-as-promised'))

const cyclic = require('../cyclic')

describe('cyclic.js#require', function () {
  it('Handles the basic project', function (done) {
    const expectedResult = [{
      parent: 'a.js',
      module: 'b.js'
    }]
    expect(cyclic.require('./samples/basic/a'))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })

  it('Handles the cyclic project', function (done) {
    const expectedResult = [{
      parent: 'c.js',
      module: 'a.js'
    }, {
      parent: 'b.js',
      module: 'c.js'
    }, {
      parent: 'a.js',
      module: 'b.js'
    }]
    expect(cyclic.require('./samples/cyclic/a'))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })

  it('Handles the nested project', function (done) {
    const expectedResult = [{
      parent: 'nested/b.js',
      module: 'c.js'
    }, {
      parent: 'a.js',
      module: 'nested/b.js'
    }]
    expect(cyclic.require('./samples/nested/a'))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })

  it('Handles relative `fs.read` calls', function (done) {
    const expectedResult = [{
      parent: 'a.js',
      module: 'nested/b.js'
    }]
    expect(cyclic.require('./samples/fs_read/a'))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })

  it('Handles external packages', function (done) {
    const expectedResult = [{
      parent: 'a.js',
      module: 'b.js'
    }]
    expect(cyclic.require('./samples/third_party/a'))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })

  it('Handles absolute imports', function (done) {
    const expectedResult = [{
      parent: 'a.js',
      module: 'b.js'
    }, {
      parent: 'a.js',
      module: 'c.js'
    }]
    const absolutePath = path.resolve('test/samples/absolute/a')
    expect(cyclic.require(absolutePath))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })

  it('Automatically enables verbose output for third-party modules', function (done) {
    cyclic.require('chai')
    .then(dependencies => {
      expect(dependencies.length).to.be.above(0)
      done()
    })
    .catch(done)
  })
})
