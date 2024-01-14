import fs from 'fs';
import path from 'path';
import { exec } from 'child_process'
import commandExists from 'command-exists';
import { fileURLToPath } from 'url';


export default class utils {

    static getDirname(metaurl) {
        const __filename = fileURLToPath(metaurl);
        return path.dirname(__filename);
    }

    static run(cmd, pipe) {
        return new Promise((resolve, reject) => {
            const child = exec(cmd);
            if (pipe) {
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
            }
            child.on('close', (code) => {
                //console.log(cmd + ` exited with code ${code}`);
                resolve();
            });
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

    static directoryExists(path) {
        try {
            return fs.existsSync(path);
        } catch (err) {
            return false;
        }
    }

    static directoryIsEmpty(path) {
        try {
            return fs.readdirSync(path).length === 0;
        } catch (err) {
            return false;
        }
    }
}