import {
  readdir,
  stat
} from 'mz/fs'
import {
  join
} from 'path'

/**
 * simple dir traversal
 * collects full paths to directories
 * depth = 1 will list directories in path, not recursive
 * @param  {String} root
 * @param  {Object} options
 * @return {Array}         files
 */
export default async function listDirs (path, depth = 1) {
  let dirs = []
  let nodes = await readdir(path)

  nodes = nodes.map((node) => join(path, node))
  while (nodes.length) {
    const node = nodes.shift()
    const stats = await stat(node)
    if (!stats.isDirectory()) continue
    dirs.push(node)
    // if depth is 1 don't recurse, otherwise pass in depth = 0 or decrement
    if (depth !== 1) dirs.concat(await listDirs(path, depth ? depth - 1 : 0))
  }
  return dirs
}
