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
} from 'irc-upd'
import {
  unlink
} from 'mz/fs'
import {
  readFileSync,
  readdirSync
} from 'fs'
import {
  loadDatabase
} from '../lib/db'
import {
  emptyDirSync
} from 'fs-extra'
import {
  ok
} from 'assert'
import _equalFixture from './equalFixture'

const equalFixture = _equalFixture(join('test', 'fixtures', 'trackers'))

/**
 * I fell into some kind of rift in the space time continuum while putting this
 * together. Best explanation I have is that mocha does some kind of code
 * inspection to determine whether something is async, and it's buggy.
 * The approach which worked was to minimise async stuff, and only use it for
 * the function passed to 'it'. Trusting that mocha will handle the
 * the serialisation.
 */
describe('ircmon sites', () => {
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
  const trackers = readdirSync('trackers')
  trackers.forEach((tracker) => {
    const {
      siteName,
      examples
    } = parse(readFileSync(join('trackers', tracker), 'utf8'))
    it(siteName, async function () {
      const listener = new Listener({ tracker: siteName }, { trackers: { [siteName]: {} } })
      await listener.init()
      const announcer = listener.tracker.announcers[0]
      const results = examples.map((e) => listener.parse(e, announcer))
      await equalFixture(siteName, results, 'unexpected result')
      const keys = [
        'name',
        'size',
        'id',
        'file',
        'uri'
      ]
      results.forEach((result) => {
        keys.forEach((key) => {
          ok(result[key], `missing value for key: ${key}`)
        })
      })
    })
  })
})
