## ircmon

![github-issues](https://img.shields.io/github/issues/fauxilla/ircmon.svg) ![stars](https://img.shields.io/github/stars/fauxilla/ircmon.svg) ![forks](https://img.shields.io/github/forks/fauxilla/ircmon.svg)

monitor irc announce channels and download matched releases

like autodl_irssi, but:

-   written with node
-   extensible
-   no irssi dependency
-   add torrent to deluge

Take a look at the awesome [annotated code](https://fauxilla.github.io/ircmon/lib/index.js.html)

## download & run binaries (not available yet)

This is convenient because you don't need to install nodejs & npm.

-   go to [release page](https://github.com/fauxilla/ircmon/releases) & download binary
-   copy `config.sample.hjson` from this repo to `config.hjson` in the same
    directory as your binary and configure paths
    [hjson reference](http://hjson.org/)

## clone repo & run from source

-   be awesome
-   install nodejs & npm
-   clone this repo somewhere like `/opt/`
-   copy `config.sample.hjson` to `config.hjson` and configure paths
    [hjson reference](http://hjson.org/)
-   `npm i` to install all the things
-   `npm run babel` to transpile code
-   start with `npm start`

## clone repo & build your own binaries (not available yet)

-   clone this repo
-   `npm i` to get dependencies
-   `npm run babel` to transpile to node 9
-   `npm run pkg-linux` or `npm run pkg-win`
-   binary will be output to `bin/`

## run from cli

**debug info**

If you run from source and initiate with `npm start` debug info will be written to the console. When running from binaries, you'd need to set a `DEBUG` environment variable to `undisco*` In linux, this is achieved with a command like `DEBUG=undisco* ./ircmon-linux-x64`.

**command line args**

Run with no params to see usage info.

If you're running from source the commands look like `npm start -- watch -l info`

## run as a service (linux) (not available yet)

## run as a service (windows)

no idea how to do this sorry.. help wanted.

## scripts

 - **npm run start** : `cross-env DEBUG=undisco* node dist`
 - **npm run build** : `npm run babel && npm run client:prodn && npm run docs && cp docs/README.md.html docs/index.html && npm run gh-pages`
 - **npm run readme** : `node-readme`
 - **npm run babel** : `babel lib -d dist --ignore client`
 - **npm run babel:watch** : `babel lib --watch -d dist --ignore client`
 - **npm run test** : `cross-env DEBUG=undisco* NODE_ENV=test mocha --compilers js:babel-register test/*Test.js`
 - **npm run test:watch** : `cross-env DEBUG=undisco* NODE_ENV=test mocha --compilers js:babel-register --watch test`
 - **npm run docs** : `npm run readme && rm -fr ./docs/* && docker -o ./docs -I -x dist,.README.md,test/fixtures,node_modules,docs`
 - **npm run gh-pages** : `gh-pages -d docs`
 - **npm run pkg-linux** : `pkg . --targets node8-linux --output bin/undisco-linux-x64`
 - **npm run pkg-win** : `pkg . --targets node8-win --output bin/undisco-win-x64.exe`
 - **npm run pkg** : `npm run pkg-linux && npm run pkg-win`

### usage

[lib/options.js:52-109](https://github.com/fauxilla/ircmon/blob/52c7c0f26563a21b78f3a1c4150898ff907fabac/lib/options.js#L52-L109 "Source code on GitHub")

### log

[lib/log.js:62-75](https://github.com/fauxilla/ircmon/blob/52c7c0f26563a21b78f3a1c4150898ff907fabac/lib/log.js#L62-L75 "Source code on GitHub")

## developing / testing / contributing

Suggestions / contributions are absolutely welcome.

Use `npm run babel` or `npm run babel:watch` to transpile source from `lib` to
`dist`, then `npm start` to run.

test with `npm run test` or `npm run test:watch`

If you want to contribute anonymously, take a look at [gitmask](https://www.gitmask.com/), you basically upload your commit to gitmask and it destroys your id before making a PR.
