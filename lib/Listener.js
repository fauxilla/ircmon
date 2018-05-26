import {
  log,
  levels as logLevels
} from './log'
import Connection from './Connection'
import {
  createWriteStream
} from 'fs'
import {
  ensureDirSync
} from 'fs-extra'
import format from 'string-template'
import request from 'request'
import deluge from 'deluge'
import {
  join
} from 'path'
import {
  parse as parseBytes
} from 'human-format'
import stringToRegExp from 'string-to-regexp'
import loadSite from './loadSite'
import {
  mapValues,
  pick
} from 'lodash'
import {
  find,
  upsert
} from './db'
import {
  check
} from './check'
import Err from './Err'

export default class Listener {
  constructor (listener, opt) {
    Object.assign(this, listener)
    this.opt = opt
    this.log = this.getLog()
    this.tests = {
      positive: this.tests
        .filter((test) => !/^!/.exec(test))
        .map(stringToRegExp),
      negative: this.tests
        .filter((test) => /^!/.exec(test))
        .map((test) => stringToRegExp(test.slice(1)))
    }
    // allow use of > when checking episode
    if (this.episode) this.episode -= 1
    if (this.minSize) {
      this.minSize = parseBytes(this.minSize)
    }
    if (this.maxSize) {
      this.maxSize = parseBytes(this.maxSize)
    }
  }
  async init () {
    const {
      nick,
      siteName,
      descriptor
    } = this
    this.site = await loadSite(siteName)
    const {
      network,
      host,
      port,
      channels
    } = this.site
    this.log.info(`connecting to ${network}`)
    this.connection = new Connection(network, host, port, nick)
    this.connection.join(channels)
    this.connection.addListener('message', this.handler.bind(this))
    Object.assign(this, await find(descriptor))
  }
  getLog () {
    const {
      descriptor
    } = this
    const _log = log.child({ descriptor })
    return Object.assign(
      {},
      ...Object.values(logLevels).map((level) => ({
        [level]: _log[level].bind(_log)
      })
    ))
  }

  parse (message, from) {
    let { placeholders } = this.site
    const {
      mode,
      site: { uriTemplate },
      log: { error }
    } = this
    if (mode === 'series') {
      const series = /S(\d{2})E\d{2}/i
      const episode = /S\d{2}E(\d{2})/i
      Object.assign(placeholders, { series, episode })
    }
    const torrent = mapValues(placeholders, (placeholder) => {
      const result = placeholder.exec(message)
      return result ? result[1] : false
    })
    if (
      (torrent.season === false) ||
      (torrent.episode === false)
    ) throw new Err('noSeriesEp', 'not an episode')
    if (!Object.values(torrent).every((e) => e)) {
      error({ meta: torrent }, 'could not parse message')
      throw new Err('parse', 'could not parse, check site definition')
    }
    torrent.series = parseInt(torrent.series) // NaN for null
    torrent.episode = parseInt(torrent.episode)
    torrent.size = parseBytes(torrent.size)
    torrent.file = torrent.name.replace(/\s/g, '.') + '.torrent'
    torrent.uri = format(
      uriTemplate,
      Object.assign({}, torrent, this.site)
    )
    torrent.announcer = from
    torrent.message = message
    return torrent
  }
  async handler (from, to, message) {
    const {
      descriptor
    } = this
    const {
      debug,
      info,
      error
    } = this.log

    debug('checking message')

    let torrent
    try {
      torrent = this.parse(message, from)
    } catch (err) {
      if (err.code !== 'noSeriesEp') throw err
      this.checkError = err
      debug(message)
      debug(`ignore: ${err.message}`)
      return
    }

    try {
      check(torrent, this)
    } catch (err) {
      if (err instanceof Err) {
        this.checkError = err
        debug(message)
        debug(`ignore: ${err.message}`)
        return
      }
      throw err
    }

    // checks passed.
    info(message)
    debug('passed all checks')
    try {
      await this.downloadTorrent(torrent)
    } catch (err) {
      error({ meta: torrent }, 'error downloading torrent')
      throw err
    }
    this.series = torrent.series
    this.episode = torrent.episode
    this.lastAt = Date.now()
    debug('done')
    await upsert(
      descriptor,
      pick(this, [ 'descriptor', 'series', 'episode', 'lastAt' ])
    )
  }
  async downloadTorrent (torrent) {
    if (this.test) return
    const {
      downloadTo
    } = this.opt
    const {
      error
    } = this.log
    try {
      switch (downloadTo) {
        case 'deluge':
          return await this.addDeluge(torrent)
        case 'blackHole':
          return await this.addBlackHole(torrent)
        default:
          error(`no downloadTo option: ${downloadTo}`)
      }
    } catch (err) {
      error({ error: err }, 'error downloading torrent')
    }
  }

  async addDeluge (torrent) {
    this.log.debug('will downloadTo deluge')
    this.log.debug(torrent.uri)
    if (!this.deluge) {
      this.log.debug('new deluge instance')
      const {
        cookies,
        site: { baseUrl }
      } = this
      const {
        deluge: {
          url,
          password
        }
      } = this.opt
      this.deluge = deluge(`${url}/json`, password)
      await new Promise((resolve, reject) => {
        this.deluge.setCookies(
          {[baseUrl]: cookies.join(';')},
          (err, result) => {
            if (err) return reject(err)
            resolve(result)
          }
        )
      })
    }
    return new Promise((resolve, reject) => {
      const {
        test
      } = this
      this.deluge.add(torrent.uri, { add_paused: test }, (err, result) => {
        if (err) {
          this.log.error({meta: {err}}, 'error adding to deluge')
          return reject(err)
        }
        this.log.info(`added to deluge: ${torrent.file}`)

        resolve()
      })
    })
  }
  async addBlackHole (torrent) {
    const {
      cookies
    } = this
    const {
      blackHole: {
        path
      }
    } = this.opt
    const {
      uri,
      file
    } = torrent
    ensureDirSync(path)
    const headers = { Cookie: cookies.join(';') }
    this.log.debug(`requesting ${uri}`)
    return new Promise((resolve, reject) => {
      request.get({ uri, headers })
        .pipe(createWriteStream(join(path, file)))
        .on('close', () => {
          this.log.info(`wrote ${file} to path`)
          resolve()
        })
    })
  }

}
