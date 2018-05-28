import request from 'request'
import {
  join
} from 'path'
import {
  createWriteStream
} from 'fs'
import {
  ensureDirSync
} from 'fs-extra'

export default async function downloader (torrent, listener) {
  const {
    cookies,
    log: {
      debug,
      info
    },
    blackHole: {
      path
    }
  } = listener
  const {
    uri,
    file
  } = torrent
  ensureDirSync(path)
  const headers = { Cookie: cookies.join(';') }
  debug(`requesting ${uri}`)
  return new Promise((resolve, reject) => {
    request.get({ uri, headers })
      .pipe(createWriteStream(join(path, file)))
      .on('close', () => {
        info(`wrote ${file} to path`)
        resolve()
      })
  })
}
