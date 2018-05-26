import deluge from 'deluge'

export default async function downloader (torrent) {
  this.log.debug('will downloadTo deluge')
  this.log.debug(torrent.uri)
  if (!this.deluge) {
    this.log.debug('new deluge instance')
    const {
      cookies,
      site: { baseUrl }
    } = this
    const {
      deluge: {
        url,
        password
      }
    } = this.opt
    this.deluge = deluge(`${url}/json`, password)
    await new Promise((resolve, reject) => {
      this.deluge.setCookies(
        {[baseUrl]: cookies.join(';')},
        (err, result) => {
          if (err) return reject(err)
          resolve(result)
        }
      )
    })
  }
  return new Promise((resolve, reject) => {
    const {
      test
    } = this
    this.deluge.add(torrent.uri, { add_paused: test }, (err, result) => {
      if (err) {
        this.log.error({meta: {err}}, 'error adding to deluge')
        return reject(err)
      }
      this.log.info(`added to deluge: ${torrent.file}`)

      resolve()
    })
  })
}
