import fs from 'fs';
import path from 'path';
import { exec, spawn } from 'child_process'
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

            process.on("exit", () => child.kill())
        });
    }

    static spawn(cmd, args, pipe) {
        return new Promise((resolve, reject) => {
            const child = spawn(cmd, args, {detached: false});
            if (pipe) {
                child.stdout.pipe(process.stdout);
                child.stderr.pipe(process.stderr);
            }
            child.on('close', (code) => {
                //console.log(cmd + ` exited with code ${code}`);
                resolve();
            });

            process.on("exit", () => child.kill())
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

    static fileExists(path) {
        try {
            return fs.existsSync(path);
        } catch (err) {
            console.log(err)
            return false;
        }
    }

    static directoryExists(path) {
        try {
            return fs.existsSync(path);
        } catch (err) {
            console.log(err)
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

    static openFile(path) {
        try {
            return fs.readFileSync(path);
        } catch (err) {
            return false;
        }
    }

    static readAppJsonConfig(config) {
        const filepath = path.join(utils.getDirname(import.meta.url), '../configs', config);
        try {
            return JSON.parse(fs.readFileSync(filepath));
        } catch (err) {
            return err;
        }
    }

    static readFileSync(path) {
        try {
            return fs.readFileSync(path);
        } catch (err) {
            return false;
        }
    }

    static saveFileSync(path, data) {
        try {
            fs.writeFileSync(path, data);
            // file written successfully
        } catch (err) {
            console.error(err);
        }
    }

    static generateRandomString(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result;
    }

    static getFileList(path) {
        return fs.readdirSync(path);
    }

    static getDirs(path){
        var contentFolders = [];
        var files = fs.readdirSync(path);
        for (var i in files) {
            if (fs.statSync('./content/' + files[i]).isDirectory()) {
                contentFolders.push(files[i]);
            }
        }
        return contentFolders
    }
}