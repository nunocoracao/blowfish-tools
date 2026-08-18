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

  static run(cmd, pipe, returnExitCode = false) {
    return new Promise((resolve, reject) => {
      const child = exec(cmd, { maxBuffer: 10 * 1024 * 1024 });
      if (pipe) {
        child.stdout.pipe(process.stdout);
        child.stderr.pipe(process.stderr);
      }
      child.on('close', (code) => {
        //console.log(cmd + ` exited with code ${code}`);
        if (returnExitCode) {
          resolve(code);
        } else {
          resolve();
        }
      });

      const killHandler = () => child.kill();
      process.once("exit", killHandler);
      child.on('close', () => process.removeListener("exit", killHandler));
    });
  }

  static runWithOutput(cmd) {
    return new Promise((resolve) => {
      const child = exec(cmd, { maxBuffer: 10 * 1024 * 1024 });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => { stdout += data; });
      child.stderr.on('data', (data) => { stderr += data; });

      child.on('close', (code) => {
        resolve({ code, stdout, stderr });
      });

      child.on('error', (err) => {
        resolve({ code: 1, stdout, stderr: stderr + err.message });
      });

      const killHandler = () => child.kill();
      process.once("exit", killHandler);
      child.on('close', () => process.removeListener("exit", killHandler));
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

      const killHandler = () => child.kill();
      process.once("exit", killHandler);
      child.on('close', () => process.removeListener("exit", killHandler));
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

      if(filePath === ''){  // return filePath('') if filePath is empty, skipping image path settings
        return filePath;
      }

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

  static getDefaultLanguage() {
    try {
      const data = fs.readFileSync('./config/_default/hugo.toml', 'utf8');
      const match = data.match(/^\s*defaultContentLanguage\s*=\s*["']([^"']+)["']/m);
      if (match) {
        return match[1];
      }
    } catch (err) {
      // No hugo.toml or unreadable - fall back to English
    }
    return 'en';
  }

  static resolveConfigPath(filePath) {
    // Config option files are declared with an ".en.toml" suffix, but sites
    // with a different default language use e.g. "menus.pt-br.toml" instead.
    const match = filePath.match(/^(.*[\\/])([^\\/.]+)\.en\.toml$/);
    if (!match) {
      return filePath;
    }
    const dir = match[1];
    const base = match[2];
    const lang = utils.getDefaultLanguage();

    var candidates = [dir + base + '.' + lang + '.toml', filePath];
    try {
      const siblings = fs.readdirSync(dir)
        .filter(f => f.startsWith(base + '.') && f.endsWith('.toml'))
        .sort()
        .map(f => dir + f);
      candidates = candidates.concat(siblings);
    } catch (err) {
      // Directory unreadable - fall through to the declared path
    }

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
    return candidates[0];
  }

  static installCustomIcons(names) {
    // Icons bundled with the CLI but not shipped by the theme are copied into
    // the site's assets/icons folder so Hugo can resolve them.
    const customDir = path.join(utils.getDirname(import.meta.url), '../configs/custom-icons');
    for (const name of [].concat(names || [])) {
      const src = path.join(customDir, name + '.svg');
      if (fs.existsSync(src)) {
        utils.directoryCreate('./assets/icons');
        utils.copyFile(src, path.join('./assets/icons', name + '.svg'));
      }
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
    try {
      fs.writeFileSync(file, content);
    } catch (err) {
      console.error(err);
    }
  }

  static fileDelete(path) {
    try {
      if (fs.existsSync(path)) {
        fs.rmSync(path);
      }
    } catch (err) {
      console.log(err);
    }
  }

  static fileChange(path, strintoreplace, replacement) {
    var data = fs.readFileSync(path, 'utf8')
    var result = data.replace(strintoreplace, replacement);
    fs.writeFileSync(path, result, 'utf8')
  }

  static directoryExists(dirPath) {
    try {
      return fs.existsSync(dirPath);
    } catch (err) {
      console.log(err)
      return false;
    }
  }

  static findGitRepoInParents(startPath) {
    // Check if there's a .git folder in any parent directory
    let currentPath = path.resolve(startPath);
    const root = path.parse(currentPath).root;

    while (currentPath !== root) {
      const gitPath = path.join(currentPath, '.git');
      if (fs.existsSync(gitPath)) {
        return currentPath;
      }
      currentPath = path.dirname(currentPath);
    }
    return null;
  }

  static directoryIsEmpty(path) {
    try {
      const files = fs.readdirSync(path);
      // Treat directories with only hidden files (like .git, .gitignore) as empty
      const nonHiddenFiles = files.filter(file => !file.startsWith('.'));
      return nonHiddenFiles.length === 0;
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

  static getDirs(dirPath) {
    var contentFolders = [];
    var files = fs.readdirSync(dirPath);
    for (var i in files) {
      if (fs.statSync(path.join(dirPath, files[i])).isDirectory()) {
        contentFolders.push(files[i]);
      }
    }
    return contentFolders
  }
}