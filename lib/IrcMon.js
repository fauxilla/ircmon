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
  mapValues
} from 'lodash'
import {
  find,
  upsert
} from './db'
import timestring from 'timestring'

export default class IrcMon {
  constructor (listener, opt) {
    this.listener = listener
    this.opt = opt
    this.log = this.getLog()
    this.site = loadSite(listener.siteName)
    this.tests = {
      positive: this.listener.tests
        .filter((test) => !/^!/.exec(test))
        .map(stringToRegExp),
      negative: this.listener.tests
        .filter((test) => /^!/.exec(test))
        .map((test) => stringToRegExp(test.slice(1)))
    }
    if (this.listener.minSize) {
      this.listener.minSize = parseBytes(this.listener.minSize)
    }
    if (this.listener.maxSize) {
      this.listener.maxSize = parseBytes(this.listener.maxSize)
    }
    const {
      nick
    } = this.listener
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
  }
  getLog () {
    const {
      descriptor
    } = this.listener
    const _log = log.child({ descriptor })
    return Object.assign(
      {},
      ...Object.values(logLevels).map((level) => ({
        [level]: _log[level].bind(_log)
      })
    ))
  }
  test (message) {
    const result = {
      positive: mapValues(this.tests.positive, (test) => test.exec(message)),
      negative: mapValues(this.tests.negative, (test) => test.exec(message))
    }
    result.pass = (
      Object.values(result.positive).every((e) => e) &&
      Object.values(result.negative).every((e) => !e)
    )
    this.log.debug({ meta: result }, 'regex tests')
    return result
  }
  parse (message) {
    const {
      uriTemplate
    } = this.site
    let {
      placeholders
    } = this.site
    const {
      mode
    } = this.listener
    if (mode === 'series') {
      const series = /S(\d{2})E\d{2}/i
      const episode = /S\d{2}E(\d{2})/i
      Object.assign(placeholders, { series, episode })
    }
    const torrent = mapValues(placeholders, (placeholder) => {
      const result = placeholder.exec(message)
      return result ? result[1] : false
    })
    if (!Object.values(torrent).every((e) => e)) return false
    torrent.series = parseInt(torrent.series) // NaN for null
    torrent.episode = parseInt(torrent.episode)
    torrent.size = parseBytes(torrent.size)
    torrent.file = torrent.name.replace(/\s/g, '.') + '.torrent'
    torrent.uri = format(uriTemplate, Object.assign({}, torrent, this.site))
    return torrent
  }
  async handler (from, to, message) {
    this.log.info(`${from}:${to} ${message}`)
    const {
      announcers
    } = this.site
    const {
      minSize,
      maxSize,
      descriptor,
      mode,
      frequency
    } = this.listener
    let {
      series,
      episode
    } = this.listener
    const {
      downloadTo
    } = this.opt
    const debug = this.log.debug.bind(this.log)
    debug('checking message')

    // announced by announcer
    if (!announcers.includes(from)) {
      debug(`${from} is not an announcer`)
      return
    }
    const tests = this.test(message)
    if (!tests.pass) {
      debug({ tests }, 'failed match tests')
      return
    }
    const record = await find(descriptor)
    if (record) {
      series = record.lastSeries
      episode = record.lastEpisode
    }

    // check frequency`
    if (
      record &&
      frequency &&
      record.lastAt + timestring(frequency, 'ms') > Date.now()
    ) {
      debug(`grabbed within the last ${frequency}. skip this one`)
      return
    }

    const torrent = this.parse(message)
    if (!torrent) return debug('message could not be parsed')

    // check 'once' mode, not already fulfilled
    if (
      mode === 'once' &&
      record
    ) return debug('once mode, already fulfilled')

    // series: check we got a series & ep from the name
    if (
      mode === 'series' &&
      (
        !torrent.series ||
        !torrent.episode
      )
    ) return debug('series mode, no series / ep in name')

    // series: check it's not an old series
    if (
      mode === 'series' &&
      torrent.series < series
    ) return debug('old series')

    // series: check it's not an old ep
    if (
      mode === 'series' &&
      torrent.series === series &&
      torrent.episode <= episode
    ) return debug('old episode')

    // check size is > minSize
    if (
      minSize &&
      torrent.size < minSize
    ) {
      debug(`failed size requirement. torrent < ${minSize}`)
      return
    }

    // check size is M maxSize
    if (
      maxSize &&
      torrent.size > maxSize
    ) {
      debug(`failed size requirement torrent > ${maxSize}`)
      return
    }

    // checks passed.
    debug('passed all checks')
    return Promise.resolve()
    .then(() => {
      if (downloadTo === 'deluge') return this.addDeluge(torrent)
      if (downloadTo === 'blackHole') return this.addBlackHole(torrent)
      this.log.debug(`no downloadTo option: ${downloadTo}`)
    })
    .then(() => {
      upsert(
        descriptor,
        {
          descriptor,
          lastSeries: torrent.series,
          lastEpisode: torrent.episode,
          lastAt: Date.now()
        }
      )
    })
  }
  async addDeluge (torrent) {
    this.log.debug('will downloadTo deluge')
    this.log.debug(torrent.uri)
    if (!this.deluge) {
      this.log.debug('new deluge instance')
      const {
        cookies
      } = this.listener
      const {
        deluge: {
          url,
          password
        }
      } = this.opt
      const {
        baseUrl
      } = this.site
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
      this.deluge.add(torrent.uri, { add_paused: true }, (err, result) => {
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
    } = this.listener
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
