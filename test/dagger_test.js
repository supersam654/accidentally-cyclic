/* globals describe, it */
const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-as-promised'))

const dagger = require('../dagger')

describe('dagger.js', function () {
  describe('#require', function () {
    it('Properly handles the basic project', function (done) {
      const expectedResult = [{
        parent: 'a.js',
        module: 'b.js'
      }]
      expect(dagger.require('samples/basic/a'))
      .to.eventually.deep.equal(expectedResult)
      .notify(done)
    })
  })

  it('Properly handles the cyclic project', function (done) {
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
    expect(dagger.require('samples/cyclic/a'))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })

  it('Properly handles the nested project', function (done) {
    const expectedResult = [{
      module: 'c.js',
      parent: 'nested/b.js'
    }, {
      module: 'nested/b.js',
      parent: 'a.js'
    }]
    expect(dagger.require('samples/nested/a'))
    .to.eventually.deep.equal(expectedResult)
    .notify(done)
  })
})
