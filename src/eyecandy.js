import fs from 'fs';
import path from 'path';
import ora from 'ora';
import utils from './utils.js';

var buffer = fs.readFileSync(path.join(utils.getDirname(import.meta.url), '../logo.txt'));
var firstRun = true;

export default class eyecandy {

  static async showWelcome() {

    console.clear();

    if (firstRun) {
      const spinner = ora('Loading awesomeness...').start();
      spinner.succeed('Awesomeness loaded');
      console.log(buffer.toString());
      console.log('Welcome to Blowfish tools.');
      console.log('I can help you setup a new project from scratch or configure an existing one (or both).');
      firstRun = false;
    }

    console.log('Please choose one of the options below, start typing to search.');

    //return a promise to continue
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  static async showBye() {
    console.log('Bye bye!');
    process.exit(0);
  }
}