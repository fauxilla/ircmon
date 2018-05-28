## ircmon

![github-issues](https://img.shields.io/github/issues/fauxilla/ircmon.svg) ![stars](https://img.shields.io/github/stars/fauxilla/ircmon.svg) ![forks](https://img.shields.io/github/forks/fauxilla/ircmon.svg)

monitor irc announce channels and download matched releases

like autodl_irssi, but:

-   written with node
-   extensible
-   no irssi dependency
-   add torrent to deluge



Take a look at the awesome [annotated code](https://fauxilla.github.io/ircmon/lib/index.html)

## download / install

**download & run binaries (not available yet)**

This is convenient because you don't need to install nodejs & npm.

-   go to [release page](https://github.com/fauxilla/ircmon/releases) & download binary
-   
    [hjson reference](http://hjson.org/)

**clone repo & run from source**

-   be awesome
-   install nodejs & npm
-   clone this repo somewhere like `/opt/`
-   copy `config.sample.hjson` to `config.hjson` and configure paths
    [hjson reference](http://hjson.org/)
-   `npm i` to install all the things
-   `npm run babel` to transpile code
-   start with `npm start`

**clone repo & build your own binaries (not available yet)**

-   clone this repo
-   `npm i` to get dependencies
-   `npm run babel` to transpile to node 9
-   `npm run pkg-linux` or `npm run pkg-win`
-   binary will be output to `bin/`

## configure

Copy `config.sample.hjson` from this repo to `config.hjson` in the same directory as your executable. The sample includes comments to explain various options.

## run

**run from cli**

*debug info*

If you run from source and initiate with `npm start` debug info will be written to the console. When running from binaries, you'd need to set a `DEBUG` environment variable to `undisco*` In linux, this is achieved with a command like `DEBUG=undisco* ./ircmon-linux-x64`.

*command line args*

Run with no params to see usage info.

If you're running from source the commands look like `npm start -- watch -l info`

**run as a service (linux) (not available yet)**

**run as a service (windows)**

no idea how to do this sorry.. help wanted.

## scripts

 - **npm run start** : `cross-env DEBUG=undisco* node dist`
 - **npm run build** : `npm run babel && npm run client:prodn && npm run docs && cp docs/README.md.html docs/index.html && npm run gh-pages`
 - **npm run readme** : `node-readme`
 - **npm run babel** : `babel lib -d dist --ignore client`
 - **npm run babel:watch** : `babel lib --watch -d dist --ignore client`
 - **npm run test** : `cross-env DEBUG=undisco* NODE_ENV=test mocha --require babel-core/register test/*Test.js`
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

**site definitions**

I need help with the site definitions. Take a look at `/trackers` and copy an existing one. If you're not comfortable with regular expressions post an issue, with whatever info you have for the tracker.

Once you add / update a tracker, you should `npm run test`. Basic tests will confirm it's working, but you really need to check the fixture in `test/fixtures/trackers` to ensure the output is what you expected.
