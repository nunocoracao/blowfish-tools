import { spawn } from 'child_process'
import ora from 'ora';
import commandExists from 'command-exists';

export default class utils {

    static run(cmd, params, callback) {
        const child = spawn(cmd, params);
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
        child.on('close', (code) => {
            console.log(cmd + ` exited with code ${code}`);
        });
    }


    static detectCommand(cmd) {
        return new Promise((resolve, reject) => {
            commandExists(cmd, function (err, commandExists) {
                if (commandExists) {
                    resolve();
                } else {
                    reject();
                }
            });
        });
    }
}