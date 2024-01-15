import fs from 'fs';
import path from 'path';
import ora from 'ora';
import utils from './utils.js';

var buffer = fs.readFileSync(path.join(utils.getDirname(import.meta.url), '../logo.txt'));

export default class eyecandy {

    static async showWelcome() {
        const spinner = ora('Loading awesomeness...').start();
        spinner.succeed('Awesomeness loaded');
        console.clear();
        console.log(buffer.toString());
        console.log('Welcome to Blowfish tools.');
        console.log('I can help you setup a new project from scratch or configure an existing one (or both).');
        console.log('Please choose one of the options below:');

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