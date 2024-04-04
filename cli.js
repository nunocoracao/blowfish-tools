#! /usr/bin/env node
import fs from 'fs';
import path from 'path';
import { program } from "commander";
import utils from './src/utils.js';
import flow from "./src/flow.js";

const data = fs.readFileSync(path.join(utils.getDirname(import.meta.url), 'package.json'))
const metadata = JSON.parse(data)

process.on('uncaughtException', function (err) {
  console.error(err);
  process.exit(1);
});

program
  .name(metadata.name)
  .description(metadata.description + '\nUse `' + metadata.name + '` to start the interactive prompt.\nRun `' + metadata.name + ' --help` for more information.')
  .version(metadata.version)
  .action(() => {
    flow.showMain();
  });


program.command('new')
  .description('Creates a new Blowfish project from scratch on the selected folder')
  .argument('<folder>', 'string to split')
  .action((str, options) => {
    flow.configureNew(str, true);
  });

program.command('install')
  .description('Installs Blowfish on an existing Hugo project (assumes current directory).')
  .action((str, options) => {
    flow.configureExisting(true);
  });

program.command('update')
  .description('Update blowfish. Requires Hugo to be installed and Blowfish configured in current directory (via git submodules).')
  .action((str, options) => {
    flow.update(true);
  });

program.command('run')
  .description('Run a local server with Blowfish in the current directory. Requires Hugo to be installed and Blowfish configured in current directory.')
  .action((str, options) => {
    flow.runServer(true);
  });

program.command('generate')
  .description('Generates site assets in public folder in the current directory. Requires Hugo to be installed and Blowfish configured in current directory.')
  .action((str, options) => {
    flow.generateSite(true);
  });

program.command('config')
  .description('Enter interactive configuration mode. Requires Hugo to be installed and Blowfish configured in current directory.')
  .action((str, options) => {
    flow.enterConfigMode(true);
  });

program.parse();