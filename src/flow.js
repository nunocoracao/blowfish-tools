
import ora from 'ora';
import pkg from 'enquirer';
const { prompt } = pkg;
import eyecandy from "./eyecandy.js";
import utils from './utils.js';

export default class flow {

    //detects whether blowfish is installed on the current folder
    static async detectBlowfish() {
        var exists = utils.directoryExists('./themes/blowfish');
        if (exists) {
            return true;
        } else {
            return false;
        }
    }

    static async showMain() {

        var blowfishIsInstalled = await flow.detectBlowfish();


        await eyecandy.showWelcome();

        var choices = [];

        for (var i in options) {
            choices.push(options[i].text);
        }

        const response = await prompt({
            type: 'AutoComplete',
            name: 'option',
            message: 'What do you need help with?',
            limit: 10,
            initial: 0,
            choices: choices
        });

        for (var i in options) {
            if (options[i].text === response.option) {
                options[i].action();
                return
            }
        }
    }

    static async showPost(message, options) {
        console.log(message)
        const response = await prompt({
            type: 'AutoComplete',
            name: 'option',
            message: 'Do you need help with anything else?',
            limit: 10,
            initial: 0,
            choices: [
                'Take me to the main menu',
                'Exit'
            ]
        });

        if (response.option === 'Exit') {
            eyecandy.showBye();
        } else if (response.option === 'Take me to the main menu') {
            flow.showMain();
        }
    }

    static async configureNew(directory, exitAfterRun) {
        const spinner = ora('Checking for dependencies').start();
        await flow.checkHugo(spinner);
        await flow.checkGit(spinner);

        var response = {};

        if (!directory) {

            response = await prompt({
                type: 'input',
                name: 'directory',
                default: 'newSite',
                message: 'Where do you want to generate your website (. for current folder)?'
            });

            if (response.directory !== '.') {
                response.directory = './' + response.directory;
            }

        } else {
            response.directory = directory;
        }

        const prespinner = ora('Checking folder').start();

        var dirExists = utils.directoryExists('./' + response.directory)
        var dirIsEmpty = utils.directoryIsEmpty('./' + response.directory)

        if (dirExists && !dirIsEmpty) {
            prespinner.fail('Directory already exists and is not empty.');
            process.exit(0);
        }

        prespinner.succeed('Folder ok...');

        const hugospinner = ora('Creating Hugo site').start();
        await utils.run('hugo new site ' + response.directory, false);
        hugospinner.succeed('Hugo site created');

        var precommand = 'cd ' + response.directory + ' && ';
        const gitspinner = ora('Initializing Git').start();
        await utils.run(precommand + 'git init', false)
        gitspinner.succeed('Git initialized');

        const blowfishspinner = ora('Installing Blowfish').start();
        await utils.run(precommand + 'git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish', false);
        blowfishspinner.succeed('Blowfish installed');

        const configblowfishspinner = ora('Configuring Blowfish').start();
        await utils.run(precommand + 'mkdir -p config/_default', false);
        await utils.run(precommand + 'cp ./themes/blowfish/config/_default/* ./config/_default/', false);
        await utils.run(precommand + 'sed -i "" "s/# theme/theme/" ./config/_default/config.toml', false);
        configblowfishspinner.succeed('Blowfish configured');

        if (exitAfterRun)
            process.exit(0);
        else
            flow.showPost('Blowfish configured in ' + response.directory + '. cd into it and run "hugo server" to start your website.', { dir: response.directory });

    }

    static async configureExisting(exitAfterRun) {
        const spinner = ora('Checking for dependencies').start();
        await flow.checkGit(spinner);

        const gitspinner = ora('Initializing Git').start();
        await utils.run('git init', false)
        gitspinner.succeed('Git initialized');

        const blowfishspinner = ora('Installing Blowfish').start();
        await utils.run('git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish', false);
        blowfishspinner.succeed('Blowfish installed');

        const configblowfishspinner = ora('Configuring Blowfish').start();
        await utils.run('mkdir -p config/_default', false);
        await utils.run('cp ./themes/blowfish/config/_default/* ./config/_default/', false);
        await utils.run('sed -i "" "s/# theme/theme/" ./config/_default/config.toml', false);
        configblowfishspinner.succeed('Blowfish configured');

        if (exitAfterRun)
            process.exit(0);
        else
            flow.showPost('Blowfish installed. Run "hugo server" to start your website.', { dir: response.directory });
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


var options = [
    {
        text: 'Setup a new website with Blowfish',
        action: flow.configureNew
    },
    {
        text: 'Install Blowfish on an existing website',
        action: flow.configureExisting
    },
    {
        text: 'Exit',
        action: eyecandy.showBye
    }
]