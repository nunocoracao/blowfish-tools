import ora from 'ora';
import terminalImage from 'terminal-image';
import got from 'got';

export default class eyecandy {

    static async showWelcome() {
        const spinner = ora('Loading awesomeness...').start();
        const image = await got('https://github.com/nunocoracao/blowfish/blob/main/blowfish_logo.png?raw=true').buffer();
        spinner.succeed('Awesomeness loaded');
        console.clear();
        console.log(await terminalImage.buffer(image, {width: '30%'}));
        console.log('Welcome to Blowfish initializer.');
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