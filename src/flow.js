
import ora from 'ora';
import pkg from 'enquirer';
const { prompt } = pkg;
import toml from 'toml-patch';
import chalk from 'chalk';
import tcpPortUsed from 'tcp-port-used';

import eyecandy from "./eyecandy.js";
import utils from './utils.js';

const iconList = [
    'amazon',
    'apple',
    'blogger',
    'bluesky',
    'codepen',
    'docker',
    'dribbble',
    'email',
    'envelope',
    'eye',
    'facebook',
    'fire',
    'flickr',
    'foursquare',
    'ghost',
    'github',
    'gitlab',
    'globe',
    'goodreads',
    'google',
    'graduation-cap',
    'hackernews',
    'hashnode',
    'heart-empty',
    'heart',
    'image',
    'instagram',
    'keybas',
    'kickstarter',
    'ko-fi',
    'lastfm',
    'lightbulb',
    'link',
    'linkedin',
    'list',
    'location-dot',
    'lock',
    'mastodon',
    'medium',
    'microsoft',
    'moon',
    'mug-hot',
    'music',
    'orcid',
    'patreon',
    'paypal',
    'pencil',
    'pgpkey',
    'phone',
    'pinterest',
    'poo',
    'reddit',
    'researchgate',
    'rss',
    'rss-square',
    'scale-balanced',
    'search',
    'shield',
    'skull-crossbone',
    'slack',
    'snapchat',
    'soundcloud',
    'stack-overflow',
    'star',
    'steam',
    'stripe',
    'substack',
    'sun',
    'tag',
    'telegram',
    'tiktok',
    'triangle-exclamation',
    'tumblr',
    'twitch',
    'twitter',
    'wand-magic-sparkles',
    'whatsapp',
    'x-twitter',
    'xmark',
    'youtube'
]

const transformedList = iconList.map(item => ({ name: item }));

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
        await utils.run('mkdir -p config/_default', false);
        await utils.run('cp ./themes/blowfish/config/_default/* ./config/_default/', false);
        await utils.run('sed -i "" "s/# theme/theme/" ./config/_default/config.toml', false);
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

    static async enterConfigMode() {

        var blowfishIsInstalled = await flow.detectBlowfish();
        if (!blowfishIsInstalled) {
            console.log('Blowfish is not installed in this folder.');
            process.exit(0);
        }

        const spinner = ora('Checking for dependencies').start();
        await flow.checkHugo(spinner);

        utils.spawn('hugo', ['server'], false);

        tcpPortUsed.waitUntilUsed(1313, 500, 4000)
            .then(function () {
                utils.run('open http://localhost:1313', false);
            }, function (err) {
                console.log('Error:', err.message);
            });

        flow.displayConfigOptions();

    }

    static async displayConfigOptions() {
        var choices = [];

        for (var i in configOptions) {
            choices.push(configOptions[i].text);
        }

        console.clear()
        const response = await prompt({
            type: 'AutoComplete',
            name: 'option',
            message: 'What do you want to configure? Start typing to search for options or scroll down to see all options',
            limit: 20,
            initial: 0,
            choices: choices
        });

        for (var i in configOptions) {
            if (configOptions[i].text === response.option) {
                configOptions[i].action();
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

        if (!data.author)
            data.author = {};

        data.author.links = [];

        for (const [key, value] of Object.entries(responseLinks)) {
            var obj = {}
            obj[key] = value;
            data.author.links.push(obj);
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
                message: 'Where image do you want to use? (full image path - drag and drop file for path)'
            }
        ]);

        var newValue = response.value

        if (newValue === currentValue)
            return

        if (!utils.fileExists(newValue)) {
            console.log('File ' + newValue + ' does not exist.');
            process.exit(0);
        }

        utils.run('cp ' + newValue + ' ./assets/', false);
        newValue = newValue.split('/').pop();

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
}


var configOptions = [

    //.config/_default/menus.en.toml
    {
        text: 'Configure menus',
        action: async () => {
            await flow.configMenus('./config/_default/menus.en.toml');
            flow.displayConfigOptions();
        }
    },
    //config/_default/languages.en.toml
    {
        text: 'Site\'s title',
        action: async () => {
            await flow.configLoop(
                './config/_default/languages.en.toml',
                null,
                'title',
                'The title of the website. This will be displayed in the site header and footer.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Site\'s logo',
        action: async () => {
            await flow.configLoop(
                './config/_default/languages.en.toml',
                'params',
                'logo',
                'Site\'s logo, the logo file should be provided at 2x resolution and supports any image dimensions.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Site\'s secondary logo',
        action: async () => {
            await flow.configLoop(
                './config/_default/languages.en.toml',
                'params',
                'secondaryLogo',
                'The logo file should be provided at 2x resolution and supports any image dimensions. This should have an inverted/contrasting colour scheme to logo. If set, this logo will be shown when users toggle from the defaultAppearance mode.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Site\'s description',
        action: async () => {
            await flow.configLoop(
                './config/_default/languages.en.toml',
                'params',
                'description',
                'The website description. This will be used in the site metadata.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Author\'s name',
        action: async () => {
            await flow.configLoop(
                './config/_default/languages.en.toml',
                'author',
                'name',
                'The author’s name. This will be displayed in article footers, and on the homepage when the profile layout is used.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Author\'s picture',
        action: async () => {
            await flow.configImage(
                './config/_default/languages.en.toml',
                'author',
                'image',
                'Image file of the author. The image should be a 1:1 aspect ratio.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Author\'s headline',
        action: async () => {
            await flow.configLoop(
                './config/_default/languages.en.toml',
                'author',
                'headline',
                'A Markdown string containing the author’s headline. It will be displayed on the profile homepage under the author’s name.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Author\'s bio',
        action: async () => {
            await flow.configLoop(
                './config/_default/languages.en.toml',
                'author',
                'bio',
                'A Markdown string containing the author’s bio. It will be displayed in article footers.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Author\'s links',
        action: async () => {
            await flow.configLinks(
                './config/_default/languages.en.toml',
                'author',
                'links',
                'The links to display alongside the author’s details. The config file contains example links which can simply be uncommented to enable. The order that the links are displayed is determined by the order they appear in the array. ');
            flow.displayConfigOptions();
        }
    },
    //config/_default/params.toml
    // Global
    {
        text: 'Color scheme',
        action: async () => {
            await flow.configLoop(
                './config/_default/params.toml',
                null,
                'colorScheme',
                'The theme colour scheme to use. Valid values are blowfish (default), Blowfish (default), Avocado, Fire, Forest, Princess, Neon, Bloody, Terminal, Marvel, Noir, Autumn, Congo, Slate. Custom themes are supported check Blowfish documentation.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Default Appearance',
        action: async () => {
            await flow.configLoop(
                './config/_default/params.toml',
                null,
                'defaultAppearance',
                'The default theme appearance, either light or dark');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Auto Switch Appearance',
        action: async () => {
            await flow.configLoop(
                './config/_default/params.toml',
                null,
                'autoSwitchAppearance',
                'Whether the theme appearance automatically switches based upon the visitor’s operating system preference. Set to false to force the site to always use the defaultAppearance.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Enable/Disable Search',
        action: async () => {
            await flow.configLoop(
                './config/_default/params.toml',
                null,
                'enableSearch',
                'Whether site search is enabled (true or false).');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Enable/Disable code copy',
        action: async () => {
            await flow.configLoop(
                './config/_default/params.toml',
                null,
                'enableCodeCopy',
                'Whether copy-to-clipboard buttons are enabled for <code> blocks. (true or false).');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Configure default background image',
        action: async () => {
            await flow.configLoop(
                './config/_default/params.toml',
                null,
                'defaultBackgroundImage',
                'Default background image for both background homepage layout and background hero style.');
            flow.displayConfigOptions();
        }
    }, 
    {
        text: 'Configure default featured image',
        action: async () => {
            await flow.configLoop(
                './config/_default/params.toml',
                null,
                'defaultFeaturedImage',
                'Default background image for all featured images across articles, will be overridden by a local featured image.');
            flow.displayConfigOptions();
        }
    }, 
    // Header
    // Footer
    // Homepage
    // Article
    // List
    // Sitemap
    // Taxonomy
    // Term
    // Firebase
    // Fathom Analytics
    // Buy me a coffee
    // Verifications
    //.config/_default/config.toml
    {
        text: 'baseURL - The URL to the root of the website.',
        action: async () => {
            await flow.configLoop(
                './config/_default/config.toml',
                null,
                'baseURL',
                'The URL to the root of the website.');
            flow.displayConfigOptions();
        }
    },
    {
        text: 'Google Analytics',
        action: async () => {
            await flow.configLoop(
                './config/_default/config.toml',
                null,
                'googleAnalytics',
                'The Google Analytics tracking ID to use. Supports v3 and v4.');
            flow.displayConfigOptions();
        }
    },
    //exit
    {
        text: 'Exit configuration mode',
        action: () => {
            flow.showMain('Configuration mode exited.');
        }
    },
]


var options = [

    {
        text: 'Enter configuration mode',
        blowfishIsInstalled: true,
        action: flow.enterConfigMode
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
        text: 'Install Blowfish on an existing website',
        blowfishIsInstalled: false,
        action: flow.configureExisting
    },
    {
        text: 'Exit',
        action: eyecandy.showBye
    }
]