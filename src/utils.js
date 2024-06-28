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
      const child = spawn(cmd, args, { detached: false });
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

  static normalizePath(filePath) {
    try {
      
      if (filePath.endsWith("'")) { 
        if (filePath.startsWith("'")) {    // dragging to Git Bash in Windows quotes in single quotes if spaces in path
          filePath = filePath.slice(1, -1);
        } 
        else if (filePath.startsWith("& '")) {  // dragging to Powershell also adds ampersand and space   
          filePath = filePath.slice(3, -1);
        } 
      }
      else if (filePath.startsWith("\"") && filePath.endsWith("\"")) {  // dragging to Command Prompt quotes with doublequotes if spaces   
        filePath = filePath.slice(1, -1);
      }

      return path.normalize(filePath); 
  
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  static extractFileName(filePath) {
    try {
      return path.basename(filePath);
    } catch (err) {
      console.log(err)
      return false;
    }  
  }

  static fileExists(path) {
    try {
      return fs.existsSync(path);
    } catch (err) {
      console.log(err)
      return false;
    }
  }

  static copyFile(srcFile, targetFile) {
    try {
      fs.copyFileSync(srcFile, targetFile);
    } catch (err) {
      console.log(err);
    }
  }


  static copyFileToFolder(srcFile, destFolder) {
    var targetFile = path.join(destFolder, path.basename(srcFile));
    utils.copyFile(srcFile, targetFile);
  }

  static writeContentToFile(file, content)
  {
    fs.writeFile(file, content, (err) => {
      if (err) {
        console.error(err);
      }
    });
  }

  static fileChange(path, strintoreplace, replacement) {
    var data = fs.readFileSync(path, 'utf8')
    var result = data.replace(strintoreplace, replacement);
    fs.writeFileSync(path, result, 'utf8')
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

  static directoryCreate(path) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  static directoryCopy(source, target) {
    if (!fs.existsSync(target)) {
      this.directoryCreate(target);
    }
    fs.cpSync(source, target, { recursive: true });
  }

  static directoryDelete(path) {
    if (fs.existsSync(path)) {
      fs.rmSync(path, {
        recursive: true
      });
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

  static getDirs(path) {
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