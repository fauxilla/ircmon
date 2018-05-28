import {
  readFile
} from 'mz/fs'
import {
  parse
} from 'hjson'
import {
  mapValues
} from 'lodash'
import stringToRegExp from 'string-to-regexp'

/**
 * ## loadSite
 * @param  {String} site sitename
 * @return {Object}      site definition
 */
export default async function loadSite (tracker) {
  let raw
  try {
    raw = await readFile(`trackers/${tracker.toLowerCase()}.hjson`, 'utf8')
  } catch (e) {
    throw new Error(`site config doesn't seem to exist: ${tracker}`)
  }
  try {
    tracker = parse(raw)
  } catch (e) {
    throw new Error(`bad tracker config: ${e.message}`)
  }
  tracker.placeholders = mapValues(tracker.placeholders, stringToRegExp)
  return tracker
}
