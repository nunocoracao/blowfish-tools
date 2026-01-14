import ora from 'ora';
import pkg from 'enquirer';
const { prompt } = pkg;
import toml from '@iarna/toml'
import chalk from 'chalk';
import tcpPortUsed from 'tcp-port-used';

import eyecandy from "./eyecandy.js";
import utils from './utils.js';

const iconList = utils.readAppJsonConfig('icons.json')

const transformedList = iconList.map(item => ({ name: item }));

var isHugoServerRunning = false;

// Helper to get localhost URL with baseURL path
function getLocalServerUrl() {
  try {
    const hugoConfig = './config/_default/hugo.toml';
    if (utils.fileExists(hugoConfig)) {
      const data = toml.parse(utils.openFile(hugoConfig).toString());
      if (data.baseURL) {
        const url = new URL(data.baseURL);
        const pathname = url.pathname;
        if (pathname && pathname !== '/') {
          // Ensure path ends with /
          const normalizedPath = pathname.endsWith('/') ? pathname : pathname + '/';
          return 'http://localhost:1313' + normalizedPath;
        }
      }
    }
  } catch (err) {
    // Ignore errors, fall back to default
  }
  return 'http://localhost:1313';
}

// Helper to safely handle prompt cancellations (ESC key)
async function safePrompt(promptConfig) {
  try {
    return await prompt(promptConfig);
  } catch (err) {
    // User cancelled with ESC - return null to signal cancellation
    return null;
  }
}

export default class flow {

  static async detectBlowfish() {
    var exists = utils.directoryExists('./themes/blowfish');
    if (exists) {
      return true;
    } else {
      return false;
    }
  }

  static async showMain(message) {

    var blowfishIsInstalled = await flow.detectBlowfish();

    await eyecandy.showWelcome();

    var choices = [];

    for (var i in options) {
      if (!options[i].hasOwnProperty('blowfishIsInstalled'))
        choices.push(options[i].text);
      else if (options[i].blowfishIsInstalled && blowfishIsInstalled)
        choices.push(options[i].text);
      else if (!options[i].blowfishIsInstalled && !blowfishIsInstalled)
        choices.push(options[i].text);
    }

    if (message) {
      console.log(message);
    }

    const response = await safePrompt({
      type: 'AutoComplete',
      name: 'option',
      message: 'What do you need help with?',
      limit: 30,
      initial: 0,
      choices: choices
    });

    if (!response) {
      // User pressed ESC - exit gracefully
      await eyecandy.showBye();
      return;
    }

    for (var i in options) {
      if (options[i].text === response.option) {
        options[i].action();
        return
      }
    }
  }

  static async configureNew(directory, exitAfterRun) {
    const spinner = ora('Checking for dependencies').start();
    await flow.checkHugo(spinner);
    await flow.checkGit(spinner);

    var response = {};

    if (!directory) {

      response = await safePrompt({
        type: 'input',
        name: 'directory',
        default: 'newSite',
        message: 'Where do you want to generate your website (. for current folder)?'
      });

      if (!response) {
        // User pressed ESC - return to main menu
        flow.showMain();
        return;
      }

      response.directory = response.directory.trim();

      if (response.directory !== '.') {
        response.directory = './' + response.directory;
      }

    } else {
      response.directory = directory.trim();
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

    // Check if there's an existing git repo in parent directories
    const existingGitRepo = utils.findGitRepoInParents(process.cwd());
    let skipGitInit = false;

    if (existingGitRepo) {
      console.log(chalk.yellow('\nFound existing Git repository at: ' + existingGitRepo));
      const gitChoice = await safePrompt({
        type: 'select',
        name: 'option',
        message: 'How would you like to handle Git?',
        choices: [
          'Use existing repository (recommended for subdirectories)',
          'Create new repository in ' + response.directory
        ]
      });

      if (!gitChoice) {
        flow.showMain();
        return;
      }

      skipGitInit = gitChoice.option.includes('Use existing');
    }

    if (!skipGitInit) {
      const gitspinner = ora('Initializing Git').start();
      await utils.run(precommand + 'git init', false)
      gitspinner.succeed('Git initialized');
    } else {
      console.log(chalk.green('✔ Using existing Git repository'));
    }

    const blowfishspinner = ora('Installing Blowfish').start();
    const submoduleExitCode = await utils.run(precommand + 'git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish', false, true);
    if (submoduleExitCode !== 0) {
      blowfishspinner.fail('Failed to install Blowfish. Please check your network connection and try again.');
      console.log('You can try manually running: git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish');
      process.exit(1);
    }
    blowfishspinner.succeed('Blowfish installed');

    const configblowfishspinner = ora('Configuring Blowfish').start();
    await utils.directoryCopy(response.directory + '/themes/blowfish/config/_default', response.directory + '/config/_default')
    await utils.fileChange(response.directory + '/config/_default/hugo.toml', '# theme', 'theme')
    configblowfishspinner.succeed('Blowfish configured');

    if (exitAfterRun)
      process.exit(0);
    else {
      process.chdir(response.directory);
      flow.showMain('Blowfish configured in ' + response.directory + ', current working directory updated.');
    }

  }

  static async copyTemplate(directory, exitAfterRun) {
    const spinner = ora('Checking for dependencies').start();
    await flow.checkHugo(spinner);
    await flow.checkGit(spinner);

    var response = {};

    var choices = []
    for (var i in Templates)
      choices.push(Templates[i].text + ' - ' + Templates[i].description)

    if (!directory) {

      response = await prompt([
        {
          type: 'autocomplete',
          name: 'template',
          message: 'Select your template - more info at https://blowfish.page/examples/',
          initial: 0,
          choices: choices
        },
        {
          type: 'input',
          name: 'directory',
          default: 'newSite',
          message: 'Where do you want to generate your website (. for current folder)?'
        }]);

      response.directory = response.directory.trim();

      if (response.directory !== '.') {
        response.directory = './' + response.directory;
      }

    } else {
      response.directory = directory.trim();
    }

    const prespinner = ora('Checking folder').start();

    var dirExists = utils.directoryExists('./' + response.directory)
    var dirIsEmpty = utils.directoryIsEmpty('./' + response.directory)

    if (dirExists && !dirIsEmpty) {
      prespinner.fail('Directory already exists and is not empty.');
      process.exit(0);
    }

    prespinner.succeed('Folder ok...');

    var template = null;
    for (var i in Templates) {
      if (Templates[i].text + ' - ' + Templates[i].description === response.template) {
        template = Templates[i];
        break;
      }
    }

    const hugospinner = ora('Cloning template').start();
    await utils.run('git clone ' + template.gitRepo + ' ' + response.directory, false);
    await utils.directoryDelete(response.directory + '/.git')
    hugospinner.succeed('Template cloned');

    var precommand = 'cd ' + response.directory + ' && ';

    // Check if there's an existing git repo in parent directories
    const existingGitRepo = utils.findGitRepoInParents(process.cwd());
    let skipGitInit = false;

    if (existingGitRepo) {
      console.log(chalk.yellow('\nFound existing Git repository at: ' + existingGitRepo));
      const gitChoice = await safePrompt({
        type: 'select',
        name: 'option',
        message: 'How would you like to handle Git?',
        choices: [
          'Use existing repository (recommended for subdirectories)',
          'Create new repository in ' + response.directory
        ]
      });

      if (!gitChoice) {
        flow.showMain();
        return;
      }

      skipGitInit = gitChoice.option.includes('Use existing');
    }

    if (!skipGitInit) {
      const gitspinner = ora('Initializing Git').start();
      await utils.run(precommand + 'git init', false)
      gitspinner.succeed('Git initialized');
    } else {
      console.log(chalk.green('✔ Using existing Git repository'));
    }

    const blowfishspinner = ora('Installing Blowfish').start();
    await utils.directoryDelete(response.directory + '/themes/blowfish')
    const submoduleExitCode = await utils.run(precommand + 'git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish', false, true);
    if (submoduleExitCode !== 0) {
      blowfishspinner.fail('Failed to install Blowfish. Please check your network connection and try again.');
      console.log('You can try manually running: git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish');
      process.exit(1);
    }
    blowfishspinner.succeed('Blowfish installed');

    if (exitAfterRun)
      process.exit(0);
    else {
      process.chdir(response.directory);
      flow.showMain('Blowfish configured in ' + response.directory + ', current working directory updated.');
    }
  }

  static async configureExisting(exitAfterRun) {

    var blowfishIsInstalled = await flow.detectBlowfish();
    if (blowfishIsInstalled) {
      console.log('Blowfish is already installed in this folder.');
      process.exit(0);
    }

    const spinner = ora('Checking for dependencies').start();
    await flow.checkGit(spinner);

    const gitspinner = ora('Initializing Git').start();
    await utils.run('git init', false)
    gitspinner.succeed('Git initialized');

    const blowfishspinner = ora('Installing Blowfish').start();
    const submoduleExitCode = await utils.run('git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish', false, true);
    if (submoduleExitCode !== 0) {
      blowfishspinner.fail('Failed to install Blowfish. Please check your network connection and try again.');
      console.log('You can try manually running: git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish');
      process.exit(1);
    }
    await utils.run('git submodule update --remote --merge', false);
    blowfishspinner.succeed('Blowfish installed');

    const configblowfishspinner = ora('Configuring Blowfish').start();
    await utils.directoryCopy('./themes/blowfish/config/_default', './config/_default')
    await utils.fileChange('./config/_default/hugo.toml', '# theme', 'theme')
    configblowfishspinner.succeed('Blowfish configured');

    if (exitAfterRun)
      process.exit(0);
    else {
      var flag = flow.detectBlowfish()
      if (flag)
        flow.showMain('Blowfish installed. Proceed with configuration.');
      else
        flow.showMain('Blowfish not installed. Please check the logs.');
    }

  }

  static async update(exitAfterRun) {

    var blowfishIsInstalled = await flow.detectBlowfish();
    if (!blowfishIsInstalled) {
      console.log('Blowfish is not installed in this folder.');
      process.exit(0);
    }

    const spinner = ora('Checking for dependencies').start();
    await flow.checkHugo(spinner);
    await flow.checkGit(spinner);

    const configblowfishspinner = ora('Updating Blowfish').start();
    await utils.run('git submodule update --remote --merge', false);
    configblowfishspinner.succeed('Blowfish updated');

    if (exitAfterRun)
      process.exit(0);
    else {
      flow.showMain('Blowfish updated.');
    }
  }

  static async runServer() {
    const spinner = ora('Checking for dependencies').start();
    await flow.checkHugo(spinner);
    console.clear();
    await utils.run('hugo server', true);
  }

  static async generateSite() {
    const spinner = ora('Checking for dependencies').start();
    await flow.checkHugo(spinner);
    console.clear();
    await utils.run('hugo', true);
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

  static async setupHugoServer() {

    if (!isHugoServerRunning) {
      const spinner = ora('Checking for dependencies').start();
      await flow.checkHugo(spinner);

      utils.spawn('hugo', ['server'], false);

      tcpPortUsed.waitUntilUsed(1313, 500, 4000)
        .then(function () {
          isHugoServerRunning = true;
          const serverUrl = getLocalServerUrl();
          utils.run('open ' + serverUrl, false);
        }, function (err) {
          console.log('Error:', err.message);
        });
    }
  }

  static async enterConfigMode(list) {

    var blowfishIsInstalled = await flow.detectBlowfish();
    if (!blowfishIsInstalled) {
      console.log('Blowfish is not installed in this folder.');
      process.exit(0);
    }

    await flow.setupHugoServer();

    flow.displayConfigOptions(list);

  }

  static async displayConfigOptions(list) {
    var choices = [];

    for (var i in list) {
      choices.push(list[i].text);
    }

    console.clear()
    const serverUrl = getLocalServerUrl();
    const response = await safePrompt({
      type: 'AutoComplete',
      name: 'option',
      message: 'What do you want to configure? \nOpen your browser at ' + serverUrl + ' to see live changes \nStart typing to search for options or scroll down to see all options',
      limit: 20,
      initial: 0,
      choices: choices
    });

    if (!response) {
      // User pressed ESC - return to main menu
      flow.showMain();
      return;
    }

    for (var i in configOptions) {
      if (list[i].text === response.option) {
        list[i].action(list);
        return
      }
    }
  }

  static async configLoop(file, parent, variable, description) {

    if (!utils.fileExists(file)) {
      console.log('File ' + file + ' does not exist.');
      process.exit(0);
    }

    var data = toml.parse(utils.openFile(file).toString());

    var currentValue = null

    if (parent && data[parent] && data[parent][variable] !== undefined) {
      currentValue = data[parent][variable]
    } else if (!parent && data[variable] !== undefined) {
      currentValue = data[variable]
    }

    // Determine if this is a boolean option based on current value or description
    var isBoolean = typeof currentValue === 'boolean' ||
      (description && (description.toLowerCase().includes('true or false') ||
                       description.toLowerCase().includes('(true or false)') ||
                       description.toLowerCase().includes('true/false')));

    console.log("Configuring:\n" + chalk.blue(variable) + (description ? ' - ' + description : ''))

    // Convert boolean to string for display
    var displayValue = currentValue;
    if (typeof currentValue === 'boolean') {
      displayValue = currentValue.toString();
    }

    const response = await safePrompt([
      {
        type: 'input',
        name: 'value',
        default: displayValue,
        message: isBoolean ? 'What is the new value? (true/false)' : 'What is the new value?'
      }
    ]);

    if (!response) {
      // User pressed ESC - return without saving
      return;
    }

    var newValue = response.value

    // Convert string to appropriate type based on content or original value type
    if (newValue === 'true') {
      newValue = true;
    } else if (newValue === 'false') {
      newValue = false;
    } else if (typeof currentValue === 'number' && !isNaN(Number(newValue))) {
      // Convert to number if current value is a number and input is numeric
      newValue = Number(newValue);
    }

    // Skip save if value hasn't changed
    if (newValue === currentValue)
      return

    if (!parent) {
      data[variable] = newValue
    } else if (data[parent]) {
      data[parent][variable] = newValue
    } else {
      data[parent] = {}
      data[parent][variable] = newValue
    }

    utils.saveFileSync(file, toml.stringify(data));
  }

  static async configLinks(file, parent, variable, description) {

    if (!utils.fileExists(file)) {
      console.log('File ' + file + ' does not exist.');
      process.exit(0);
    }

    var data = toml.parse(utils.openFile(file).toString());

    console.log("Configuring:\n" + chalk.blue(variable) + (description ? ' - ' + description : ''))

    const response = await prompt([
      {
        type: 'multiselect',
        name: 'value',
        message: 'Which links to you want to configure for your profile?\nSelect using spacebar and press enter when done. \nKeep scrolling to see all options',
        limit: 10,
        choices: transformedList
      }
    ]);


    var linksQuestions = [];
    for (var i in response.value) {
      linksQuestions.push({
        type: 'input',
        name: response.value[i],
        message: 'What URL do you want to configure for ' + response.value[i] + '?'
      });
    }

    const responseLinks = await prompt(linksQuestions);

    if (!data.params.author)
      data.params.author = {};

    data.params.author.links = [];

    for (const [key, value] of Object.entries(responseLinks)) {
      var obj = {}
      obj[key] = value;
      data.params.author.links.push(obj);
    }

    utils.saveFileSync(file, toml.stringify(data));
  }

  static async configImage(file, parent, variable, description) {

    if (!utils.fileExists(file)) {
      console.log('File ' + file + ' does not exist.');
      process.exit(0);
    }

    var data = toml.parse(utils.openFile(file).toString());

    var currentValue = '';

    if (parent && data[parent] && data[parent][variable]) {
      currentValue = data[parent][variable]
    } else if (!parent && data[variable]) {
      currentValue = data[variable]
    }

    console.log("Configuring:\n" + chalk.blue(variable) + (description ? ' - ' + description : ''))

    const response = await prompt([
      {
        type: 'input',
        name: 'value',
        default: currentValue,
        message: 'Where is the image you want to use? (full image path and the tool will copy it into the right folder)',
        validate: (input) => {
          // exclude spaces or dots-only inputs to prevent config errors
          if (/^[\s.]+$/.test(input)) {
            return 'Spaces or dots only (e.g., " . ") are invalid. Please enter a valid image path.';
          }
          return true;
        }
      }
    ]);


    var newValue = utils.normalizePath(response.value);

    if (newValue === currentValue)
      return

    var processChanges = () => {
      utils.copyFileToFolder(newValue, 'assets');
      newValue = utils.extractFileName(newValue);

      if (!parent) {
        data[variable] = newValue
      } else if (data[parent]) {
        data[parent][variable] = newValue
      } else {
        data[parent] = {}
        data[parent][variable] = newValue
      }

      utils.saveFileSync(file, toml.stringify(data));
    }

    utils.directoryCreate('assets');
    processChanges();

  }

  static async configMenus(file) {

    if (!utils.fileExists(file)) {
      console.log('File ' + file + ' does not exist.');
      process.exit(0);
    }

    var inMenuConfigCycle = true;

    while (inMenuConfigCycle) {

      var data = toml.parse(utils.openFile(file).toString());

      const response = await safePrompt({
        type: 'AutoComplete',
        name: 'option',
        message: 'What do you want to configure? start typing to search for options.',
        limit: 20,
        initial: 0,
        choices: [
          'View Menus',
          'Create new menu',
          'Delete header menu entry',
          'Delete footer menu entry',
          'Sort header menus',
          'Sort footer menus',
          'Go back'
        ]
      });

      if (!response) {
        // User pressed ESC - go back
        inMenuConfigCycle = false;
        continue;
      }

      const dictionary = {
        identifier: 'identifier',
        name: 'name',
        pageRef: 'link',
        url: 'url',
        pre: 'icon',
        weight: 'weight'
      }

      var headerMenus = [];
      var footerMenus = [];

      for (var i in data.main) {
        var obj = {}
        for (var j in data.main[i]) {
          obj[dictionary[j]] = data.main[i][j];
        }
        if (!data.main[i].none)
          headerMenus.push(obj)
      }
      headerMenus.sort((a, b) => (a.weight > b.weight) ? 1 : -1)

      for (var i in data.footer) {
        var obj = {}
        for (var j in data.footer[i]) {
          obj[dictionary[j]] = data.footer[i][j];
        }
        if (!data.footer[i].none)
          footerMenus.push(obj)
      }
      footerMenus.sort((a, b) => (a.weight > b.weight) ? 1 : -1)


      if (response.option === 'View Menus') {

        console.log('Header menus:');
        for (var i in headerMenus) {
          var str = '';
          for (var j in headerMenus[i]) {
            str += j + ': ' + headerMenus[i][j] + '; ';
          }
          console.log(str)
        }

        console.log(' ');

        console.log('Footer menus:');
        for (var i in footerMenus) {
          var str = '';
          for (var j in footerMenus[i]) {
            str += j + ': ' + footerMenus[i][j] + '; ';
          }
          console.log(str)
        }

        console.log(' ');

      } else if (response.option === 'Create new menu') {

        var newMenu = Object.create(null);
        var place = null;

        const wherePrompt = await prompt([
          {
            type: 'select',
            name: 'option',
            message: 'Do you want to create a header or footer menu?',
            choices: ['header', 'footer']
          }
        ]);
        if (wherePrompt.option === 'header')
          place = 'main';
        else if (wherePrompt.option === 'footer')
          place = 'footer';

        const titlePrompt = await prompt([
          {
            type: 'input',
            name: 'name',
            default: '',
            message: 'What is the name of the new menu? (you can leave this empty and select an icon after)'
          }
        ]);
        if (titlePrompt.name !== '')
          newMenu.name = titlePrompt.name;

        if (place === 'main') {
          const iconPrompt = await prompt([
            {
              type: 'select',
              name: 'option',
              message: 'Pick an icon to place in the menu option or select none? (Keep scrolling to see all icons)',
              limit: 10,
              choices: ['none'].concat(iconList)
            }
          ]);

          if (iconPrompt.option != 'none') {
            newMenu.pre = iconPrompt.option;
          }
        }

        const linkConfigs = await prompt([
          {
            type: 'select',
            name: 'option',
            message: 'Do you want this menu to link to an internal or external page?',
            choices: ['internal', 'external']
          },
          {
            type: 'input',
            name: 'value',
            default: 'newSite',
            message: 'Where should the menu link? if you picked internal, type the page name (e.g. posts), if you picked external, type the full URL.'
          }
        ]);

        if (linkConfigs.option === 'internal') {
          newMenu.pageRef = linkConfigs.value;
        } else if (linkConfigs.option === 'external') {
          newMenu.url = linkConfigs.value;
        }

        newMenu.identifier = utils.generateRandomString(10);
        newMenu.weight = 9999;

        if (!data.main) {
          data.main = [];
          data.main.push({ none: 'none' })
        }

        if (!data.footer) {
          data.footer = [];
          data.footer.push({ none: 'none' })
        }

        data[place].push(newMenu);

        utils.saveFileSync(file, toml.stringify(data));

      } else if (response.option === 'Delete header menu entry') {

        if (headerMenus.length == 0) {
          console.log('No header menus to delete.');
        } else {

          const deleteHeaderResponse = await safePrompt([
            {
              type: 'multiselect',
              name: 'value',
              message: 'Select menus to delete (use spacebar to select and enter to confirm):',
              choices: headerMenus
            }
          ]);

          if (!deleteHeaderResponse) {
            // User pressed ESC - continue to menu
            continue;
          }

          if (deleteHeaderResponse.value.length > 0) {

            // Filter out menus that are in the delete list
            var newHeaderMenus = data.main.filter(menu => {
              return !deleteHeaderResponse.value.includes(menu.name);
            });
            data.main = newHeaderMenus;
            if (data.main.length === 0) {
              data.main.push({ none: 'none' })
            }

            utils.saveFileSync(file, toml.stringify(data));
          }
        }
      } else if (response.option === 'Delete footer menu entry') {

        if (footerMenus.length == 0) {
          console.log('No footer menus to delete.');
        } else {

          const deleteFooterResponse = await safePrompt([
            {
              type: 'multiselect',
              name: 'value',
              message: 'Select menus to delete (use spacebar to select and enter to confirm):',
              choices: footerMenus
            }
          ]);

          if (!deleteFooterResponse) {
            // User pressed ESC - continue to menu
            continue;
          }

          if (deleteFooterResponse.value.length > 0) {

            // Filter out menus that are in the delete list
            var newFooterMenus = data.footer.filter(menu => {
              return !deleteFooterResponse.value.includes(menu.name);
            });
            data.footer = newFooterMenus;
            if (data.footer.length === 0) {
              data.footer.push({ none: 'none' })
            }
            utils.saveFileSync(file, toml.stringify(data));
          }
        }

      } else if (response.option === 'Sort header menus') {

        var choices = [];
        for (var i in headerMenus) {
          choices.push(headerMenus[i].name)
        }

        const sortResponse = await prompt([
          {
            type: 'sort',
            name: 'sorted',
            message: 'Sort the menus in order of preference (top is left, bottom is right):',
            hint: '(Use <shift>+<up/down> to move, <enter> to confirm.))',
            numbered: false,
            choices: choices
          }
        ]);

        console.log(sortResponse)

        for (var i in sortResponse.sorted) {
          for (var j in data.main) {
            if (data.main[j].name === sortResponse.sorted[i]) {
              data.main[j].weight = parseInt(i) + 1;
            }
          }
        }

        utils.saveFileSync(file, toml.stringify(data));


      } else if (response.option === 'Sort footer menus') {

        var choices = [];
        for (var i in footerMenus) {
          choices.push(footerMenus[i].name)
        }

        const sortResponse = await prompt([
          {
            type: 'sort',
            name: 'sorted',
            message: 'Sort the menus in order of preference (top is left, bottom is right):',
            hint: '(Use <shift>+<up/down> to move, <enter> to confirm.))',
            numbered: false,
            choices: choices
          }
        ]);

        console.log(sortResponse)

        for (var i in sortResponse.sorted) {
          for (var j in data.footer) {
            if (data.footer[j].name === sortResponse.sorted[i]) {
              data.footer[j].weight = parseInt(i) + 1;
            }
          }
        }

        utils.saveFileSync(file, toml.stringify(data));

      } else if (response.option === 'Go back') {
        inMenuConfigCycle = false
      }
    }
  }

  static async generateNewSection() {
    if (!utils.directoryExists('./content')) {
      console.log('Content folder does not exist.');
      process.exit(0);
    }

    const response = await prompt([
      {
        type: 'input',
        name: 'name',
        default: 'posts',
        message: 'What is the name of the new section?'
      }
    ]);

    var newSection = response.name;

    if (utils.directoryExists('./content/' + newSection)) {
      flow.showMain('Section already exists.');
    } else {
      utils.directoryCreate('./content/' + newSection);
      // Create _index.md so Hugo recognizes this as a section with its own page
      var sectionTitle = newSection.charAt(0).toUpperCase() + newSection.slice(1);
      var indexContent = "---\n" +
        "title: \"" + sectionTitle + "\"\n" +
        "---\n";
      utils.writeContentToFile('./content/' + newSection + '/_index.md', indexContent);
      flow.showMain('Section ' + newSection + ' created.')
    }

  }

  static async generateNewArticle() {

    var contentFolders = utils.getDirs('./content');

    if (contentFolders.length === 0) {
      console.log('No sections found in content folder.');
      console.log('Please create a section first.');
    } else {

      const response = await prompt([
        {
          type: 'select',
          name: 'option',
          message: 'Select the section where you want to create the article:',
          choices: contentFolders
        },
        {
          type: 'input',
          name: 'name',
          default: 'new-article',
          message: 'What is the name of the new article?'
        }
      ]);

      var newArticle = response.name;
      var articleSlug = newArticle.toLowerCase().replaceAll(' ', '-');
      var articlePath = response.option + '/' + articleSlug;

      if (utils.directoryExists('./content/' + articlePath)) {
        console.log('Article already exists.');
      } else {
        // Use hugo new to respect archetypes
        const spinner = ora('Creating article').start();
        const articleFilePath = './content/' + articlePath + '/index.md';
        const result = await utils.runWithOutput('hugo new content/' + articlePath + '/index.md');

        // Check if Hugo command succeeded AND the file was actually created
        const fileCreated = utils.fileExists(articleFilePath);

        if (result.code !== 0 || !fileCreated) {
          if (result.code !== 0) {
            spinner.fail('Failed to create article with Hugo archetypes');
            // Show Hugo's error output to help diagnose issues
            if (result.stderr) {
              console.log('Hugo error: ' + result.stderr.trim());
            }
            if (result.stdout && result.stdout.includes('ERROR')) {
              console.log('Hugo output: ' + result.stdout.trim());
            }
          } else {
            spinner.fail('Hugo ran but file was not created');
          }
          console.log('Falling back to default content...');
          // Fallback to manual creation if hugo new fails
          var content = "---\n" +
            "title: \"" + newArticle + "\"\n" +
            "date: " + new Date().toISOString().split('T')[0] + "\n" +
            "draft: true\n" +
            "description: \"\"\n" +
            "---\n";
          utils.directoryCreate('./content/' + articlePath);
          utils.writeContentToFile(articleFilePath, content);
        } else {
          spinner.succeed('Article created using Hugo archetypes');
        }

        // Copy banner image as featured image
        utils.copyFile(utils.getDirname(import.meta.url) + '/../banner.png', './content/' + articlePath + '/featured.png');
        flow.showMain('Article ' + newArticle + ' created at content/' + articlePath);
      }

    }
  }
}


var configOptions = [{
  text: 'Configure menus',
  method: 'menus',
  action: async (list) => {
    await flow.configMenus('./config/_default/menus.en.toml');
    flow.displayConfigOptions(list);
  }
}]

var exitOption = {
  text: 'Exit configuration mode',
  method: 'exit',
  action: () => {
    flow.showMain('Configuration mode exited.');
  }
}

var configOptionsJSONList = utils.readAppJsonConfig('configOptions.json');

function createAction(method, file, parent, key, description) {
  return async (list) => {
    await flow[method](
      file,
      parent,
      key,
      description);
    flow.displayConfigOptions(list);
  }
}

for (var i in configOptionsJSONList) {
  var obj = {}
  obj.text = configOptionsJSONList[i].text;
  obj.method = configOptionsJSONList[i].method;
  obj.file = configOptionsJSONList[i].file;
  obj.parent = configOptionsJSONList[i].parent;
  obj.key = configOptionsJSONList[i].key;
  obj.description = configOptionsJSONList[i].description;
  obj.action = createAction(obj.method, obj.file, obj.parent, obj.key, obj.description);
  configOptions.push(obj)
}
configOptions.push(exitOption)


var options = [
  {
    text: 'Enter full configuration mode (all options)',
    blowfishIsInstalled: true,
    action: async () => {
      flow.enterConfigMode(configOptions);
    }
  },
  {
    text: 'Configure menus',
    blowfishIsInstalled: true,
    action: async () => {
      await flow.setupHugoServer();
      await flow.configMenus('./config/_default/menus.en.toml');
      await flow.showMain('Configuration mode exited.');
    }
  },
  {
    text: 'Configure overall site',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === null || configOptions[i].method === 'exit') {
          tempList.push(configOptions[i])
        }
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure site author',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === 'params.author' || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure homepage',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "homepage" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure header',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "header" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure footer',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "footer" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure article pages',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "article" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure list pages',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "list" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure taxonomy pages',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "taxonomy" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure term pages',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "term" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure Firebase (views/likes)',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "firebase" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure analytics',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "fathomAnalytics" ||
            configOptions[i].parent === "umamiAnalytics" ||
            configOptions[i].parent === "selineAnalytics" ||
            configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure Buy Me a Coffee',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "buymeacoffee" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure site verification',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "verification" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure RSS/advertising',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].parent === "rssnext" ||
            configOptions[i].parent === "advertisement" ||
            configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Configure images',
    blowfishIsInstalled: true,
    action: async () => {

      var tempList = []
      for (var i in configOptions) {
        if (configOptions[i].method === "configImage" || configOptions[i].method === 'exit')
          tempList.push(configOptions[i])
      }

      flow.enterConfigMode(tempList);
    }
  },
  {
    text: 'Generate a new site section (e.g. posts)',
    blowfishIsInstalled: true,
    action: flow.generateNewSection
  },
  {
    text: 'Generate a new article',
    blowfishIsInstalled: true,
    action: flow.generateNewArticle
  },
  {
    text: 'Run a local server with Blowfish',
    blowfishIsInstalled: true,
    action: flow.runServer
  },
  {
    text: 'Generate the static site with Hugo',
    blowfishIsInstalled: true,
    action: flow.generateSite
  },
  {
    text: 'Update Blowfish installation',
    blowfishIsInstalled: true,
    action: flow.update
  },
  {
    text: 'Setup a new website with Blowfish',
    blowfishIsInstalled: false,
    action: flow.configureNew
  },
  {
    text: 'Start from a configured template',
    blowfishIsInstalled: false,
    action: flow.copyTemplate
  },
  {
    text: 'Install Blowfish on an existing website',
    blowfishIsInstalled: false,
    action: flow.configureExisting
  },
  {
    text: 'Exit',
    action: eyecandy.showBye
  }
]

var Templates = [
  {
    text: 'Blowfish Template',
    description: 'A simple template to get you started',
    gitRepo: 'https://github.com/nunocoracao/blowfish_template'
  },
  {
    text: 'Blowfish Artist',
    description: 'A artist portfolio template',
    gitRepo: 'https://github.com/nunocoracao/blowfish_artist/'
  },
  {
    text: 'Blowfish Lowkey',
    description: 'A low key template',
    gitRepo: 'https://github.com/nunocoracao/blowfish_lowkey/'
  },
  {
    text: 'Blowfish Lite',
    description: 'Lite configuration for a clean blog',
    gitRepo: 'https://github.com/nunocoracao/blowfish_lite/'
  }
]