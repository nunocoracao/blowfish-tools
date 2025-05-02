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

    const response = await prompt({
      type: 'AutoComplete',
      name: 'option',
      message: 'What do you need help with?',
      limit: 30,
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
    for (var i in Tempaltes)
      choices.push(Tempaltes[i].text + ' - ' + Tempaltes[i].description)

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

    var template = null;
    for (var i in Tempaltes) {
      if (Tempaltes[i].text + ' - ' + Tempaltes[i].description === response.template) {
        template = Tempaltes[i];
        break;
      }
    }

    const hugospinner = ora('Cloning template').start();
    await utils.run('git clone ' + template.gitRepo + ' ' + response.directory, false);
    await utils.directoryDelete(response.directory + '/.git')
    hugospinner.succeed('Template cloned');

    var precommand = 'cd ' + response.directory + ' && ';
    const gitspinner = ora('Initializing Git').start();
    await utils.run(precommand + 'git init', false)
    gitspinner.succeed('Git initialized');

    const blowfishspinner = ora('Installing Blowfish').start();
    await utils.directoryDelete(response.directory + '/themes/blowfish')
    await utils.run(precommand + 'git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish', false);
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
    await utils.run('git submodule add --depth 1 -b main https://github.com/nunocoracao/blowfish.git themes/blowfish', false);
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
          utils.run('open http://localhost:1313', false);
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
    const response = await prompt({
      type: 'AutoComplete',
      name: 'option',
      message: 'What do you want to configure? \nOpen your browser at http://localhost:1313 to see live changes \nStart typing to search for options or scroll down to see all options',
      limit: 20,
      initial: 0,
      choices: choices
    });

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
        message: 'What is the new value?'
      }
    ]);

    var newValue = response.value
    if (newValue === 'true')
      newValue = true
    if (newValue === 'false')
      newValue = false

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

    var currentValue = null

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
        message: 'Where is the image you want to use? (full image path and the tool will copy it into the right folder)'
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

      const response = await prompt({
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

          const deleteHeaderResponse = await prompt([
            {
              type: 'multiselect',
              name: 'value',
              message: 'Select menus to delete (use spacebar to select and enter to confirm):',
              choices: headerMenus
            }
          ]);

          if (deleteHeaderResponse.value.length > 0) {

            var newHeaderMenus = [];
            for (var j in deleteHeaderResponse.value) {
              for (var i in data.main) {
                if (data.main[i].name != deleteHeaderResponse.value[j]) {
                  newHeaderMenus.push(data.main[i]);
                }
              }
            }
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

          const deleteFooterResponse = await prompt([
            {
              type: 'multiselect',
              name: 'value',
              message: 'Select menus to delete (use spacebar to select and enter to confirm):',
              choices: footerMenus
            }
          ]);

          if (deleteFooterResponse.value.length > 0) {

            var newFooterMenus = [];
            for (var j in deleteFooterResponse.value) {
              for (var i in data.footer) {
                if (data.footer[i].name != deleteFooterResponse.value[j]) {
                  newFooterMenus.push(data.footer[i]);
                }
              }
            }
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
      console.log('Section already exists.');
    } else {
      utils.directoryCreate('./content/' + newSection);
      flow.showMain('Folder ' + newSection + ' created.')
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

      if (utils.fileExists('./content/' + response.option + '/' + newArticle)) {
        console.log('Article already exists.');
      } else {
        var articleid = new Date().getTime() + '-' + newArticle.replaceAll(' ', '-');
        var content = "---\n" +
          "title: \"" + newArticle + "\"\n" +
          "date: " + new Date().toISOString().split('T')[0] + "\n" +
          "draft: false\n" +
          "description: \"a description\"\n" +
          "tags: [\"example\", \"tag\"]\n" +
          "---\n an example to get you started\n" +
          "# This is a heading\n" +
          "## This is a subheading\n" +
          "### This is a subsubheading\n" +
          "#### This is a subsubsubheading\n" +
          "This is a paragraph with **bold** and *italic* text.\n" +
          "Check more at [Blowfish documentation](https://blowfish.page/)\n" +
        utils.directoryCreate('./content/' + response.option + '/' + articleid);
        utils.copyFile(utils.getDirname(import.meta.url) + '/../banner.png', './content/' + response.option + '/' + articleid + '/featured.png')
        utils.writeContentToFile('./content/' + response.option + '/' + articleid + '/index.md', content);
        flow.showMain('Article ' + newArticle + ' created.')
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

        }

        tempList.push(configOptions[i])
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
        if (configOptions[i].parent === 'author' || configOptions[i].method === 'exit')
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

var Tempaltes = [
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