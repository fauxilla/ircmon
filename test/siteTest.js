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
import _equalFixture from './equalFixture'

async function getHjson (descriptor) {
  const path = join('test', 'fixtures', 'sites', `${descriptor}Config.hjson`)
  return parse(await readFile(path, 'utf8'))
}
const equalFixture = _equalFixture(join('test', 'fixtures', 'sites'))

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
  it('iptorrents', async () => {
    const fixtures = await getHjson('01iptorrents')
    let { listener } = fixtures
    const {
      opt,
      messages
    } = fixtures
    listener = new Listener(listener, opt)
    await listener.init()
    const announcer = listener.site.announcers[0]
    const results = messages.map((m) => listener.parse(m, announcer))
    await equalFixture('01iptorrents', results, 'unexpected result')
  })
})
