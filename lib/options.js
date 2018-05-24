import hjson from 'hjson'
import commandLineArgs from 'command-line-args'
import commandLineUsage from 'command-line-usage'
import {
  readFile
} from 'mz/fs'

async function options () {
  let opt
  try {
    opt = hjson.parse(await readFile('./config.hjson', 'utf8'))
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
    console.log(`You don't seem to have a config file.`)
    return
  }

  if (['watch', 'log'].includes(process.argv[2])) {
    opt.command = process.argv[2]
  } else {
    opt.command = 'usage'
  }
  let args = commandLineArgs(
    [
      { name: 'num-lines', alias: 'n', type: Number },
      { name: 'descriptor', alias: 'd', type: String },
      { name: 'log-level', alias: 'l', type: String }
    ],
    {
      argv: process.argv.slice(3) || []
    }
  )
  opt.numLines = args['num-lines'] || 20
  if (args['descriptor']) opt.descriptor = args['descriptor']
  // if (args['path']) opt.path = args.path
  // if (args['release']) opt.release = args.release
  // if (args['force']) opt.force = args.force
  if (args['log-level']) opt.logLevel = args['log-level']

  //
  // if (['dir', 'log'].includes(opt.command) && !opt.release) {
  //   throw new Error('--release option is required for dir or log commands')
  // }
  //
  // if (!opt.poll && !opt.watch) {
  //   throw new Error('if "watch" is false, "poll" must be > 0')
  // }

  return opt
}

function usage () {
  console.log(commandLineUsage([
    {
      header: 'IrcMon',
      content: 'IRC announce listener'
    },
    {
      header: 'Synopsis',
      content: '$ ircmon <command> <options>'
    }
    // {
    //   header: 'Commands',
    //   content: [
    //     { name: 'watch', summary: 'Monitor for changes.' },
    //     { name: 'once', summary: 'Iterate over folders once.' },
    //     { name: 'dir', summary: 'Process specific directory. (see examples)' }
    //   ]
    // },
    // {
    //   header: 'Parameters',
    //   content: [
    //     {
    //       name: '-f, --force',
    //       summary: 'force processing & copy even if completed previously'
    //     },
    //     {
    //       name: '-p, --path',
    //       summary: 'specify root dir for once / watch modes'
    //     },
    //     {
    //       name: '-r, --release',
    //       summary: 'specify partial dir name for dir / log modes'
    //     },
    //     {
    //       name: '-l, --log-level',
    //       summary: 'specify log level, either info or debug'
    //     }
    //   ]
    // },
    // {
    //   header: 'Examples',
    //   content: [
    //     {
    //       name: './undisco-linux-x64 once -p /srv/downloads',
    //       summary: 'basic usage for binary'
    //     },
    //     {
    //       name: 'npm start -- once -p /srv/downloads',
    //       summary: 'basic usage for source'
    //     },
    //     {
    //       name: 'npm start -- dir -r fringe',
    //       summary: 'process first directory containing "fringe"'
    //     }
    //   ]
    // }
  ]))
}

export { options, usage }
