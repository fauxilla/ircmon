// import {
//   back as nockBack
// } from 'nock'
import assert from 'assert'
import debug from 'debug'
import Listener from '../lib/Listener'
import {
  stub
} from 'sinon'
// import sinon from 'sinon'
// import http from 'http'
import {
  parse
} from 'hjson'
import {
  join
} from 'path'
import {
  Client
} from 'irc'

import {
  readFile,
  unlink
} from 'mz/fs'
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
// nockBack.setMode('record')
// nockBack.fixtures = 'test/fixtures/nockBack'

async function getFixture (descriptor) {
  const path = join('test', 'fixtures', `${descriptor}.hjson`)
  return parse(await readFile(path, 'utf8'))
}
describe('undisco', () => {
  before(async () => {
    try {
      await unlink('test/.store')
    } catch (e) {
      console.log('store doesnt exist')
      // file doesn't exist
    }
    loadDatabase('test/.store')
    emptyDirSync('test/blackHole')

    // newter irc Client
    stub(Client.prototype, 'connect').callsArg(0)
    stub(Client.prototype, 'join').callsArg(1)
    stub(Listener.prototype, 'downloadTorrent').resolves()
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
  it('check: announced by announcer', async () => {
    const fixtures = await getFixture('01announcer')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'notAnnouncer',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'announcer')
    listener.connection.removeAllListeners('message')
  })
  it('check: no match', async () => {
    const fixtures = await getFixture('02match')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'match')
    listener.connection.removeAllListeners('message')
  })
  it('check: series mode, msg contains SxxExx', async () => {
    const fixtures = await getFixture('03noSeriesEp')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'noSeriesEp')
    listener.connection.removeAllListeners('message')
  })
  it('check: series mode, old series', async () => {
    const fixtures = await getFixture('04series')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'series')
    listener.connection.removeAllListeners('message')
  })
  it('check: series mode, old ep', async () => {
    const fixtures = await getFixture('05episode')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'episode')
    listener.connection.removeAllListeners('message')
  })
  it('check: series mode, increment ep', async () => {
    const fixtures = await getFixture('06incrementEpisode')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError, undefined)
    // not possible to await event handler
    await new Promise((resolve) => setTimeout(resolve, 250))
    // same message twice
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'episode')
    listener.connection.removeAllListeners('message')
  })
  it('check: minSize', async () => {
    const fixtures = await getFixture('07minSize')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'minSize')
    listener.connection.removeAllListeners('message')
  })
  it('check: maxSize', async () => {
    const fixtures = await getFixture('08maxSize')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'maxSize')
    listener.connection.removeAllListeners('message')
  })
  it('check: frequency', async () => {
    const fixtures = await getFixture('09frequency')
    let { listener } = fixtures
    const {
      opt,
      message
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    listener.connection.emit(
      'message',
      'IPT',
      null,
      message
    )
    assert.equal(listener.checkError.code, 'frequency')
    listener.connection.removeAllListeners('message')
  })
})
