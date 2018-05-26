import {
  log,
  levels as logLevels
} from './log'
import Connection from './Connection'
import format from 'string-template'
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
import {
  deluge,
  blackHole
} from './downloaders'

/**
 * ## Listener
 * Listener class responsible for creating irc connection, monitoring it,
 * and handling matched files.
 * @type {Listener}
 */
export default class Listener {
  /**
   * ## constructor
   * strictly limited to parsing options
   * @param {[type]} listener [description]
   * @param {[type]} opt      [description]
   */
  constructor (listener, opt) {
    Object.assign(this, listener)
    this.opt = opt
    this.log = this.getLog()
    // split tests into positive & negative matches. See check
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
  /**
   * ## init
   * async initialisation. must be called.
   * @return {Promise} resolves when initialised
   */
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

    // get last match info from db
    Object.assign(this, await find(descriptor))
  }

  /**
   * ## getLog
   * creates bound log functions with descriptor.
   * allos usage like:
   * ```
   * const { debug } = this.log
   * debug('hello')
   * ```
   * @return {Object} plain object with log level methods
   */
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

  /**
   * ## parse
   * parse message according to placeholders in site definition, as well as
   * season / ep if appropriate
   * @param  {String} message irc message, stripped
   * @param  {String} from    username of message author
   * @return {Object}         map of resolved placeholders
   */
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

  /**
   * ## handler
   * attached to message listener.
   *  * parse message
   *  * checks
   *  * download torrent
   * @param  {String}  from    username of author
   * @param  {String}  to      unused
   * @param  {String}  message message, stripped
   * @return {Promise}         resolves on completion
   */
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
      check(torrent, this)
      info(message)
      debug('passed all checks')
      await this.downloadTorrent(torrent)
    } catch (err) {
      if (err instanceof Err) {
        this.checkError = err
        debug(message)
        debug(`ignore: ${err.message}`)
        return
      }
      error({ meta: torrent }, 'error downloading torrent')
      throw err
    }

    // update instance
    this.series = torrent.series
    this.episode = torrent.episode
    this.lastAt = Date.now()

    // update db
    await upsert(
      descriptor,
      pick(this, [ 'descriptor', 'series', 'episode', 'lastAt' ])
    )
  }

  /**
   * ## downloadTorrent
   * @param  {Object}  torrent from parse fn
   * @return {Promise}
   */
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
          return await deluge(torrent)
        case 'blackHole':
          return await blackHole(torrent)
        default:
          error(`no downloadTo option: ${downloadTo}`)
      }
    } catch (err) {
      error({ error: err }, 'error downloading torrent')
    }
  }

}
