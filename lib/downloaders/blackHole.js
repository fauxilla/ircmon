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

export default async function downloader (torrent) {
  const {
    cookies
  } = this
  const {
    blackHole: {
      path
    }
  } = this.opt
  const {
    uri,
    file
  } = torrent
  ensureDirSync(path)
  const headers = { Cookie: cookies.join(';') }
  this.log.debug(`requesting ${uri}`)
  return new Promise((resolve, reject) => {
    request.get({ uri, headers })
      .pipe(createWriteStream(join(path, file)))
      .on('close', () => {
        this.log.info(`wrote ${file} to path`)
        resolve()
      })
  })
}
