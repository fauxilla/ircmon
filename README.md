## undiscombobulate

![github-issues](https://img.shields.io/github/issues/fauxilla/undiscombobulate.svg) ![stars](https://img.shields.io/github/stars/fauxilla/undiscombobulate.svg) ![forks](https://img.shields.io/github/forks/fauxilla/undiscombobulate.svg)

extensible post processing for movies & tv

Undisco scans your completed downloads, identifies the movie or tv episode, and copies the release into your media archive with appropriate file names.

Should work on both Linux and Windows.

Take a look at the awesome [annotated code](https://fauxilla.github.io/undiscombobulate/lib/index.js.html)

## unrar dependency

For any of the install / run methods listed below you'll need `unrar` in your path.

In windows, the easiest way to achieve this is:

 * download `UnRAR for Windows` [from rarlab](https://www.rarlab.com/rar_add.htm)
 * extract to root folder (if running from source) or the same folder as the binary (if running binary)
 * rename it to `unrar.exe`

## download & run binaries

This is convenient because you don't need to install nodejs & npm.

 * go to [release page](https://github.com/fauxilla/undiscombobulate/releases) & download binary
 * copy `config.sample.hjson` from this repo to `config.hjson` in the same
   directory as your binary and configure paths
   [hjson reference](http://hjson.org/)

## clone repo & run from source

 * be awesome
 * install nodejs & npm
 * clone this repo somewhere like `/opt/`
 * copy `config.sample.hjson` to `config.hjson` and configure paths
   [hjson reference](http://hjson.org/)
 * `npm i` to install all the things
 * `npm run babel` to transpile code
 * start with `npm start`

## clone repo & build your own binaries

 * clone this repo
 * `npm i` to get dependencies
 * `npm run babel` to transpile to node 9
 * `npm run pkg-linux` or `npm run pkg-win`
 * binary will be output to `bin/`

## run from cli

__debug info__

If you run from source and initiate with `npm start` debug info will be written to the console. When running from binaries, you'd need to set a `DEBUG` environment variable to `undisco*` In linux, this is achieved with a command like `DEBUG=undisco* ./undisco-linux-x64`.

__command line args__

Run with no params to see usage info.

If you're running from source the commands look like `npm start -- watch -p /srv/downloads`

## run as a service (linux)

  * copy binary or clone repo to `/opt/undiscombobulate`
  * create config in that dir
  * copy `undiscombobulate.service` into `/etc/systemd/system`
  * modify `ExecStart` and `WorkingDirectory` paths in that file
  * make your entry point executable, so `chmod +x dist/index.js` if you're running from source or `chmod +x undisco-linux-x64` if you're running binaries
  * make `dist/service.js` executable as in `chmod +x dist/service.js`
  * start with `sudo systemctl start undiscombobulate.service`
  * check logs with `sudo journalctl -u undiscombobulate.service`
  * start on boot with `sudo systemctl enable undiscombobulate.service`

## run as a service (windows)

no idea how to do this sorry.. help wanted.

## watching vs polling

In the options you can specify a watch option (true / false) or a poll option
(minutes or false). Watching file systems in general is pretty shady, it might
work for you, it might not. Polling isnt great either because theres always
a delay, and your hard drives wont go to sleep. So try watching and if that
doesn't work fall back to polling.

## modules

Undisco has a modular architecture, and is very easy to extend. You could create your own module in the root dir, then add the full list of modules to `config.hjson`
with the path `../myModule`. It might look like this:

```
{
  modules: [
    listFiles
    skip
    unrar
    readNfo
    parseName
    tmdb
    ../myModule
    placeholders
    ignore
    destPaths
    copy
    clean
  ]
}
```

Take a look in `/modules/` for examples of how modules work.

## scripts

 - **npm run start** : `cross-env DEBUG=undisco* node dist`
 - **npm run build** : `npm run babel && npm run client:prodn && npm run docs && cp docs/README.md.html docs/index.html && npm run gh-pages`
 - **npm run readme** : `node-readme`
 - **npm run babel** : `babel lib -d dist --ignore client`
 - **npm run babel:watch** : `babel lib --watch -d dist --ignore client`
 - **npm run test** : `cross-env DEBUG=undisco* NODE_ENV=test mocha --compilers js:babel-register test`
 - **npm run test:watch** : `cross-env DEBUG=undisco* NODE_ENV=test mocha --compilers js:babel-register --watch test`
 - **npm run docs** : `npm run readme && rm -fr ./docs/* && docker -o ./docs -I -x dist,.README.md,test/fixtures,node_modules,docs`
 - **npm run gh-pages** : `gh-pages -d docs`
 - **npm run pkg-linux** : `pkg . --targets node8-linux --output bin/undisco-linux-x64`
 - **npm run pkg-win** : `pkg . --targets node8-win --output bin/undisco-win-x64.exe`
 - **npm run pkg** : `npm run pkg-linux && npm run pkg-win`

## developing / testing / contributing

Suggestions / contributions are absolutely welcome.

Use `npm run babel` or `npm run babel:watch` to transpile source from `lib` to
`dist`, then `npm start` to run.

test with `npm run test` or `npm run test:watch`

If you want to contribute anonymously, take a look at [gitmask](https://www.gitmask.com/), you basically upload your commit to gitmask and it destroys your id before making a PR.
