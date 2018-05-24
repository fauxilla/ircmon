import {
  back as nockBack
} from 'nock'
import assert from 'assert'
import debug from 'debug'
import ircMon from '../lib'
import {
  stub,
  rewire
} from 'sinon'
// import sinon from 'sinon'
// import http from 'http'
import hjson from 'hjson'

import {
  readFileSync,
  statSync,
  unlink
} from 'fs'
import {
  loadDatabase
} from '../lib/db'
import {
  emptyDirSync
} from 'fs-extra'

// eslint-disable-next-line no-unused-vars
const dbg = debug('undisco:test')

/**
 * nockBack records http requests and replays them next time the tests are run
 * the first time you run these tests, the requests will be sent to
 * themoviedb.org, so you'll need your apiKey in ../config.hjson
 * thereafter, the requests won't actually be sent.
 * to avoid committing your apiKey, the stored requests are .gitignored.
 */
nockBack.setMode('record')
nockBack.fixtures = 'test/fixtures/nockBack'

const opt = {
  downloadTo: 'deluge',
  deluge: {
    enabled: true,
    url: 'http://someurl',
    password: 'deluge'
  },
  blackHole: {
    enabled: true,
    path: 'test/blackHole'
  }
}

describe('undisco', () => {
  before(async (done) => {
    try {
      await unlink('test/.store')
    } catch (e) {
      // file doesn't exist
    }
    loadDatabase('test/.store')
    emptyDirSync('test/blackHole')
    const StubbedConnection = stub()
    StubbedConnection.prototype.join = stub()
    StubbedConnection.prototype.addListener = stub()
    rewire('lib/Connection').set('Connection', StubbedConnection)
    done()
  })
  beforeEach(function () {
    // create spy
    // sinon.spy(cloudinary.api, 'resources')
    // this.stubWrite = sinon.stub(LogSql.prototype, 'write')
    // this.stubLastLog = sinon.stub(LogSql, 'lastLog').resolves()
    // this.requestSpy = sinon.spy(http, 'request')
  })
  afterEach(function () {
    // this.stubWrite.restore()
    // this.stubLastLog.restore()
    // this.requestSpy.restore()
    // cloudinary.api.resources.restore()
  })
  it('check: announced by announcer', async (done) => {
    const listener = {
      siteName: 'IPTorrents'
    }
    const ircMon = new IrcMon(listener, opt)
    ircMon.handler('notAnnouncer', null, '')
  })
  it('resolve movie from path', (done) => {
    nockBack('1', (writeRequests) => {
      const opt = Object.assign({}, config, {path: 'test/fixtures/1'})
      undisco(opt)
      .then((dump) => {
        assert(dump[0].tmdb.title, 'Hostiles')
        writeRequests()
        done()
      })
    })
  }).timeout(5000)

  it('resolve tv from path', (done) => {
    nockBack('2', (writeRequests) => {
      const opt = Object.assign({}, config, {path: 'test/fixtures/2'})
      undisco(opt)
      .then((dump) => {
        assert(dump[0].placeholders.title, 'Fringe')
        assert.doesNotThrow(() => statSync(dump[0].files[0].destPath))
        writeRequests()
        done()
      })
    })
  }).timeout(5000)
  it('resolve from nfo', (done) => {
    nockBack('3', (writeRequests) => {
      const opt = Object.assign({}, config, {path: 'test/fixtures/3'})
      undisco(opt)
      .then((dump) => {
        // console.log(dump[0].files)
        assert(dump[0].placeholders.title, 'Old Boy')
        assert.doesNotThrow(() => statSync(dump[0].files[0].destPath))
        writeRequests()
        done()
      })
    })
  }).timeout(5000)
  it('extract rar', (done) => {
    nockBack('4', (writeRequests) => {
      const opt = Object.assign({}, config, {path: 'test/fixtures/4'})
      undisco(opt)
      .then((dump) => {
        // console.log(dump[0].files)
        assert(dump[0].placeholders.title, 'Fringe')
        assert.doesNotThrow(() => statSync(dump[0].files[0].destPath))
        writeRequests()
        done()
      })
    })
  }).timeout(5000)
})
