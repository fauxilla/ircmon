import {
  readFileSync
} from 'fs'
import {
  parse
} from 'hjson'
import {
  mapValues
} from 'lodash'
import stringToRegExp from 'string-to-regexp'

export default function loadSite (site) {
  let raw
  try {
    raw = readFileSync(`sites/${site.toLowerCase()}.hjson`, 'utf8')
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
