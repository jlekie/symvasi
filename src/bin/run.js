#!/usr/bin/env node

import Bluebird from 'bluebird';
import Commander from 'commander';
import Yaml from 'js-yaml';

import Logquacious from 'logquacious';
import ConsoleChannel from 'logquacious-console';

import FS from 'fs-extra';
import Path from 'path';

Bluebird.promisifyAll(FS);

const pack = require('../package.json');

const homePath = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
const workingPath = process.cwd();
const appPath = Path.resolve(__dirname, '..');

try {
    const loggerConfigPath = Path.resolve(homePath, `.${pack.name}`, 'logging.yml');
    const loggerConfig = Yaml.safeLoad(FS.readFileSync(loggerConfigPath, 'utf8'));
    
    Logquacious.initialize(loggerConfig, {
        'console': ConsoleChannel
    });
}
catch (err) {
    const loggerConfigPath = Path.resolve(appPath, 'cfg', 'logging.yml');
    const loggerConfig = Yaml.safeLoad(FS.readFileSync(loggerConfigPath, 'utf8'));
    
    Logquacious.initialize(loggerConfig, {
        'console': ConsoleChannel
    });
}

const logger = new Logquacious('symvasi');

const { Generator } = require('../index');

function collect(val, memo) {
    memo.push(val);
    return memo;
}

(async function run() {
    Commander
        .version(pack.version)
        .usage('[options] <manifest>')
        .parse(process.argv);
    
    logger.debug('Loading manifest...');
    let manifestPath = Path.resolve(workingPath, Commander.args[0]);
    let manifest = await FS.readFileAsync(manifestPath, 'utf8').then(content => Yaml.safeLoad(content));
    
    let targetsPath = Path.resolve(homePath, `.${pack.name}`, 'targets');
    let templatesPath = workingPath;
    
    logger.debug('Creating generator...');
    let generator = new Generator(manifest, targetsPath, templatesPath);
    
    logger.debug('Generating outputs...');
    await generator.generateAsync();
    
    logger.info('Done');
})().catch((err) => {
    logger.error(err);
    // console.error(err);
});