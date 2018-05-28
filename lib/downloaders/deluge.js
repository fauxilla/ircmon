import deluge from 'deluge'

export default async function downloader (torrent, listener) {
  const {
    log: {
      debug,
      info,
      error
    },
    opt: {
      deluge: {
        options
      }
    }
  } = listener
  debug('will downloadTo deluge')
  debug(torrent.uri)
  if (!listener.deluge) {
    debug('new deluge instance')
    const {
      cookies,
      site: { baseUrl },
      opt: {
        deluge: {
          url,
          password
        }
      }
    } = listener
    listener.deluge = deluge(`${url}/json`, password)
    await new Promise((resolve, reject) => {
      listener.deluge.setCookies(
        {[baseUrl]: cookies.join(';')},
        (err, result) => {
          if (err) return reject(err)
          resolve(result)
        }
      )
    })
  }
  return new Promise((resolve, reject) => {
    listener.deluge.add(torrent.uri, options, (err, result) => {
      if (err) {
        error({ meta: err }, 'error adding to deluge')
        return reject(err)
      }
      info(`added to deluge: ${torrent.file}`)

      resolve()
    })
  })
}
