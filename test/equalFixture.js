import {
  readFile,
  writeFile
} from 'mz/fs'
import {
  ok,
  deepEqual
} from 'assert'
import {
  join
} from 'path'

export default function equalFixture (dir) {
  return async (descriptor, actual, message) => {
    const path = join(dir, `${descriptor}Fixture.json`)
    let expected
    try {
      expected = JSON.parse(await readFile(path, 'utf8'))
    } catch (err) {
      if (err.code === 'ENOENT') {
        const content = JSON.stringify(actual, null, 2)
        await writeFile(path, content, 'utf8')
        const msg = `no fixture "${descriptor}". wrote it. check & re-run test`
        ok(false, msg)
      }
    }
    deepEqual(actual, expected, message)
  }
}
