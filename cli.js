#! /usr/bin/env node

import { spawn } from 'child_process'


var run = (cmd, params) => {

    const child = spawn(cmd, params);
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
    child.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

}

run(`hugo`, ['new', 'site', 'test'])

/*import ora from 'ora';
import commandExists from 'command-exists';



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

console.log(process.platform)


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