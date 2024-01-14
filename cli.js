#! /usr/bin/env node

import eyecandy from "./src/eyecandy.js";
import flow from "./src/flow.js";

eyecandy.showWelcome()
.then(() => {
    flow.showMain();
});

//import path from 'path';
//import utils from './src/utils.js';




// 2 run options - config or new

// check software needed is available: git, hugo, etc, other commands to replace the files
// check if there is a hugo project in the target folder
// check if the theme is blowfish
// gather information for folder
// init hugo project
// Install theme
// start configuration steps
// ask for information regarding the site

/*
import pkg from 'enquirer';
const { prompt } = pkg;

const response = await prompt({
  type: 'input',
  name: 'username',
  default: 'jonschlinkert',
  message: 'What is your username?'
});

console.log(response);
*/

//utils.run(`hugo`, ['new', 'site', 'test'])
//utils.run(`git`, ['init'])
//utils.run(`git`, ['submodule', 'add', '-b', 'main', 'https://github.com/nunocoracao/blowfish.git', 'themes/blowfish'])

//open browser

/*import ora from 'ora';



const spinner = ora('Checking reqs').start();

function detectCommand(command) {
    const spinner = ora('Loading unicorns').start();

    commandExists(command, function(err, commandExists) {
        if(commandExists) {
            spinner.succeed(command + ' is available');
        } else {
            spinner.fail(command + ' not found');
        }
    });
}



detectCommand('ls');a
detectCommand('brew');
detectCommand('hugsso');
detectCommand('git');*/

//console.log(process.platform)


//start new hugo project
//hugo new site mywebsite

/*

setTimeout(() => {
    spinner.color = 'yellow';
    spinner.text = 'Loading rainbows';
}, 1000);

setTimeout(() => {
    spinner.succeed('Successful');
}, 2000);


commandExists('ls', function(err, commandExists) {

    if(commandExists) {
        console.log("Command exists");
    }

});

//console.log("Hello NPM  sdasdasd")


/*function helloNpm() {
    return "hello NPM"
}

module.exports = helloNpm
*/