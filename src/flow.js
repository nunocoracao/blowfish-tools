
import ora from 'ora';
import pkg from 'enquirer';
const { prompt } = pkg;
import eyecandy from "./eyecandy.js";
import utils from './utils.js';

export default class flow {

    static async showMain() {
        const response = await prompt({
            type: 'AutoComplete',
            name: 'option',
            message: 'What is your username?',
            limit: 10,
            initial: 0,
            choices: [
                '1) Setup a new website with Blowfish',
                '2) Configure an existing website with Blowfish',
                '3) Configure the menu structure',
                '4) Exit'
            ]
        });

        console.log(response);

        if (response.option === '4) Exit') {
            eyecandy.showBye();
        } else if (response.option === '1) Setup a new website with Blowfish') {
            flow.configureNew();
        }
    }

    static async configureNew() {
        console.clear();

        const spinner = ora('Checking for depedencies').start();
        await flow.checkHugo(spinner);
        await flow.checkGit(spinner);

        const response = await prompt({
            type: 'input',
            name: 'directory',
            default: 'newwebsite',
            message: 'Where do you want to generate your website?'
        });

        console.log(response);
    }

    static async checkHugo(spinner) {
        return new Promise((resolve, reject) => {
            spinner.text = 'Checking Hugo';
            utils.detectCommand('hugo')
                .then(() => {
                    spinner.succeed('Hugo is available');
                    resolve();
                })
                .catch(() => {
                    spinner.fail('Hugo is not available');
                    console.log('Please install Hugo and try again.');
                    console.log('You can download it from https://gohugo.io/getting-started/installing/');
                    process.exit(0);
                })
        });
    }

    static async checkGit(spinner) {
        return new Promise((resolve, reject) => {
            spinner.text = 'Checking Git';
            utils.detectCommand('git')
                .then(() => {
                    spinner.succeed('Git is available');
                    resolve();
                })
                .catch(() => {
                    spinner.fail('Git is not available');
                    console.log('Please install Git and try again.');
                    process.exit(0);
                })
        });
    }


}