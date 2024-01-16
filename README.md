# [Blowfish Tools](https://blowfish.page/)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/nunocoracao/blowfish-tools/blob/main/LICENSE)
[![Node.js Package](https://github.com/nunocoracao/blowfish-tools/actions/workflows/release-package.yml/badge.svg)](https://github.com/nunocoracao/blowfish-tools/actions/workflows/release-package.yml)
[![npm version](https://img.shields.io/npm/v/blowfish-tools.svg?style=flat-square)](https://www.npmjs.org/package/blowfish-tools)
[![install size](https://img.shields.io/badge/dynamic/json?url=https://packagephobia.com/v2/api.json?p=blowfish-tools&query=$.install.pretty&label=install%20size&style=flat-square)](https://packagephobia.now.sh/result?p=blowfish-tools)
[![npm downloads](https://img.shields.io/npm/dm/blowfish-tools.svg?style=flat-square)](https://npm-stat.com/charts.html?package=blowfish-tools)

![blowfish logo](https://github.com/nunocoracao/blowfish-tools/blob/main/banner.png?raw=true)

CLI to initialize and configure a [Blowfish](https://blowfish.page) project. Install the CLI globally and run `blowfish-tools` to start the interactive prompt that will walk you through setting up a Blowfish from scratch or configure an existing project.

## Features
- Create a new Blowfish project from scratch
- Configure an existing Hugo project to use Blowfish
- Run a local server with Blowfish
- Generate the static site with Hugo
- Configure site's main information - title, description, etc
- Configure site's author - name, bio, links, etc

## Installation
Install globally using:

```bash
npm install -g blowfish-tools
```

## Interactive run

Start an interactive run with

```bash
blowfish-tools
```

## Non-interactive run

Use this package as part of scripts or CI/CD actions

```bash
blowfish-tools -h
Usage: blowfish-tools [options] [command]

CLI to initialize and configure a Blowfish project.
Use `blowfish-tools` to start the interactive prompt.
Run `blowfish-tools --help` for more information.

Options:
  -V, --version  output the version number
  -h, --help     display help for command

Commands:
  new <folder>   Creates a new Blowfish project from scratch on the selected folder
  install        Installs Blowfish on an existing Hugo project (assumes current directory).
  run            Run a local server with Blowfish in the current directory. Requires Hugo to be installed and
                 Blowfish configured in current directory.
  generate       Generates site assets in public folder in the current directory. Requires Hugo to be
                 installed and Blowfish configured in current directory.
  config         Enter interactive configuration mode
  configMeta     Configure site\'s main information - title, description, etc
  configAuthor   Configure site\'s author - name, bio, links, etc
```
