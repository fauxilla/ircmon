import Nedb from 'nedb'
import {
  promisify
} from 'util'
import {
  pick
} from 'lodash'

let store
export function loadDatabase (path = '.store') {
  store = new Nedb(path)
  store.findOne = promisify(Nedb.prototype.findOne)
  store.update = promisify(Nedb.prototype.update)
  store.loadDatabase()
}
loadDatabase()

export async function find (descriptor) {
  let record = await store.findOne({ descriptor })
  if (!record) record = { descriptor }
  record = pick(record, ['descriptor', 'series', 'episode', 'lastAt'])
  return record
}
export async function upsert (descriptor, listener) {
  return await store.update({ descriptor }, listener, { upsert: true })
}
