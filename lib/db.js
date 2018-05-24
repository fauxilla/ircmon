import Nedb from 'nedb'
import {
  promisify
} from 'util'

let store
export function loadDatabase (path = '.store') {
  store = new Nedb(path)
  store.findOne = promisify(Nedb.prototype.findOne)
  store.update = promisify(Nedb.prototype.update)
  store.loadDatabase()
}
loadDatabase()

export async function find (descriptor) {
  return await store.findOne({ descriptor })
  .then((listener) => listener || { descriptor })
}
export async function upsert (descriptor, listener) {
  return await store.update({ descriptor }, listener, { upsert: true })
}
