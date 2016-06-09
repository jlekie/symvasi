#!/usr/bin/env node
// @flow

import Bluebird from 'bluebird';
import Commander from 'commander';
import Yaml from 'js-yaml';

import Logquacious from 'logquacious';
import ConsoleChannel from 'logquacious-console';

import FS from 'fs-extra';
import Path from 'path';

Bluebird.promisifyAll(FS);

// $FlowIgnore: relative path correct on build
const pack = require('../package.json');

const homePath: string = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || '/';
const workingPath: string = process.cwd();
const appPath: string = Path.resolve(__dirname, '..');

try {
    const loggerConfigPath: string = Path.resolve(homePath, `.${pack.name}`, 'logging.yml');
    const loggerConfig: Object = Yaml.safeLoad(FS.readFileSync(loggerConfigPath, 'utf8'));
    
    Logquacious.initialize(loggerConfig, {
        'console': ConsoleChannel
    });
}
catch (err) {
    const loggerConfigPath: string = Path.resolve(appPath, 'cfg', 'logging.yml');
    const loggerConfig: Object = Yaml.safeLoad(FS.readFileSync(loggerConfigPath, 'utf8'));
    
    Logquacious.initialize(loggerConfig, {
        'console': ConsoleChannel
    });
}

const logger = new Logquacious('symvasi');

const { Generator } = require('../index');

function collect(val: string, memo: Array<string>): Array<string> {
    memo.push(val);
    return memo;
}

(async function run() {
    Commander
        .version(pack.version)
        .usage('[options] <manifest>')
        .parse(process.argv);
    
    logger.debug('Loading manifest...');
    let manifestPath: string = Path.resolve(workingPath, Commander.args[0]);
    let manifest: Object = await FS.readFileAsync(manifestPath, 'utf8').then(content => Yaml.safeLoad(content));
    
    let targetsPath: string = Path.resolve(homePath, `.${pack.name}`, 'targets');
    let templatesPath: string = workingPath;
    
    logger.debug('Creating generator...');
    let generator: Generator = new Generator(manifest, targetsPath, templatesPath);
    
    logger.debug('Generating outputs...');
    await generator.generateAsync();
    
    logger.info('Done');
})().catch((err) => {
    logger.error(err);
    // console.error(err);
});