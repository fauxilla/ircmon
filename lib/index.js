
import {
  options,
  usage
} from './options'
import Listener from './Listener'
import fontAscii from 'font-ascii'
import {
  log,
  levels
} from './log'
import {
  readFile
} from 'mz/fs'

async function ircMon () {
  const opt = await options()
  const commands = {
    watch: runWatch,
    usage: runUsage,
    log: runLog
  }
  return await commands[opt.command](opt)
}

async function runUsage (opt) {
  usage()
}

async function runLog (opt) {
  let lines = []
  let logFile = 0
  let contents = []
  const level = Object.keys(levels).find((level) => {
    if (levels[level] === opt.logLevel) return parseInt(level)
  })
  while (lines.length < opt.numLines) {
    if (!contents.length) {
      let file = `ircMon.log${logFile ? `.${logFile}` : ''}`
      logFile += 1
      try {
        contents = await readFile(file, 'utf8')
        contents = contents.split('\n')
        contents.pop() // ditch last empty string
      } catch (e) {
        break
      } // no more log files
    }
    const line = JSON.parse(contents.pop())

    // log.debug({ meta: { level: line.level, descriptor: line.descriptor } }, 'log line')
    if (line.level < level) continue
    if (opt.descriptor && line.descriptor !== opt.descriptor) continue
    log[levels[line.level]](line, line.msg)
    lines += 1
  }
}

async function runWatch (opt) {
  log.info('run watch')
  // eslint-disable-next-line no-unused-vars
  const listeners = opt.listeners.map((listener) => {
    listener = new Listener(listener, opt)
    listener.init()
    return listener
  })
}

// only run if called (not impoted)
if (!module.parent) {
  (async function () {
    fontAscii('ircmon', { typeface: 'SmallSlant', color: 'blue' })
    try {
      ircMon(await options())
    } catch (err) {
      console.log(err)
      log.error({meta: err}, err.message)
    }
  })()
}
