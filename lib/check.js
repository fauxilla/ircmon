import timestring from 'timestring'
import Err from './Err'

export function check (...args) {
  [
    announcer,
    match,
    noSeriesEp,
    series,
    episode,
    minSize,
    maxSize,
    once,
    frequency
  ].forEach((fn) => fn(...args))
}

function announcer (torrent, listener) {
  const {
    announcer
  } = torrent
  const {
    announcers
  } = listener.tracker
  if (!announcers.includes(announcer)) {
    throw new Err('announcer', `${announcer} is not an announcer`)
  }
}
function match (torrent, listener) {
  const {
    positive,
    negative
  } = listener.tests
  const {
    debug
  } = listener.log
  const {
    message
  } = torrent
  const result = {
    positive: Object.assign(
      {},
      ...positive.map((re) => ({ [re.toString()]: re.exec(message) }))
    ),
    negative: Object.assign(
      {},
      ...negative.map((re) => ({ [re.toString()]: re.exec(message) }))
    )
  }
  result.pass = (
    Object.values(result.positive).every((e) => e) &&
    Object.values(result.negative).every((e) => !e)
  )
  debug({ meta: result }, 'regex tests')
  if (!result.pass) {
    throw new Err('match', 'failed regex tests')
  }
}
function noSeriesEp (torrent, listener) {
  if (
    listener.mode === 'series' &&
    (
      !torrent.series ||
      !torrent.episode
    )
  ) {
    throw new Err('noSeriesEp', 'mode is series, no series/ep in name')
  }
}
function series (torrent, listener) {
  if (
    (listener.mode === 'series') &&
    (torrent.series < listener.series)
  ) {
    throw new Err('series', `series ${torrent.series} is non-current`)
  }
}
function episode (torrent, listener) {
  if (
    (listener.mode === 'series') &&
    (torrent.series === listener.series) &&
    (torrent.episode <= listener.episode)
  ) {
    throw new Err('episode', `ep ${torrent.episode} is non-current`)
  }
}
function minSize (torrent, listener) {
  if (
    listener.minSize &&
    (torrent.size < listener.minSize)
  ) {
    throw new Err('minSize', `${torrent.size} < min ${listener.minSize}`)
  }
}
function maxSize (torrent, listener) {
  if (
    listener.maxSize &&
    (torrent.size > listener.maxSize)
  ) {
    throw new Err('maxSize', `${torrent.size} > max ${listener.minSize}`)
  }
}
function once (torrent, listener) {
  if (
    listener.lastAt &&
    listener.mode === 'once'
  ) {
    throw new Err('once', 'already grabbed')
  }
}
function frequency (torrent, listener) {
  const {
    frequency
  } = listener
  if (
    frequency &&
    listener.lastAt + timestring(frequency, 'ms') > Date.now()
  ) {
    throw new Err('frequency', `grabbed within last ${frequency}`)
  }
}
