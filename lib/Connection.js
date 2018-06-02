import {
  log
} from './log'
import irc from 'irc-upd'

const connections = {}

/**
 * ## Connection
 * wrapper for irc.Client, ensures only one instance per host/nick
 * @type {Connection}
 */
export default class Connection extends irc.Client {
  constructor (network, host, port, nick) {
    const id = `${network}:${nick}`
    if (connections[id]) return connections[id]
    super(host, nick, {
      port,
      autoConnect: false,
      stripColors: true
    })
    this.log = log.child({ descriptor: network })
    this.active = new Promise((resolve) => this.connect(resolve))
    this.active.then(() => this.log.info(`connected to ${id}`))
    this.addListener('message', (from, to, message) => {
      this.log.info(`${from}: ${message}`)
    })
    this.addListener('error', (message) => this.log.error(message))
    connections[id] = this
  }
  async join (channels) {
    channels = [].concat(channels)
    await this.active
    channels.forEach((channel) => {
      super.join(channel, () => {
        this.log.debug(`joined ${channel}`)
      })
    })
  }
}
