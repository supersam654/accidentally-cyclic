/* globals describe, it */
const Module = require('module')

const chai = require('chai')
const expect = chai.expect
chai.use(require('chai-as-promised'))

const dagger = require('../dagger')

describe('dagger.js', function () {
  describe('#require', function () {
    it('Restores `require` after the promise resolves.', function (done) {
      const originalRequire = require
      const originalLoad = Module._load

      dagger.require('samples/basic/a')
      .then(() => {
        expect(require).to.equal(originalRequire)
        expect(originalLoad).to.equal(Module._load)
        done()
      }).catch(done)
    })
  })

  it('Restores `process.exit` after the promise resolves.', function (done) {
    const originalProcessExit = process.exit
    dagger.require('samples/basic/a')
    .then(() => {
      expect(process.exit).to.equal(originalProcessExit)
      done()
    }).catch(done)
  })

  it('Restores `process.cwd()` after the promise resolves.', function (done) {
    const originalCwd = process.cwd()
    dagger.require('samples/basic/a')
    .then(() => {
      expect(process.cwd()).to.equal(originalCwd)
      done()
    }).catch(done)
  })
})
