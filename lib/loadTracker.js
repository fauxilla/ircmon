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
export default async function loadSite (site) {
  let raw
  try {
    raw = await readFile(`trackers/${site.toLowerCase()}.hjson`, 'utf8')
  } catch (e) {
    throw new Error(`site config doesn't seem to exist: ${site}`)
  }
  try {
    site = parse(raw)
  } catch (e) {
    throw new Error(`bad site config: ${e.message}`)
  }
  site.placeholders = mapValues(site.placeholders, stringToRegExp)
  return site
}
