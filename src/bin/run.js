#!/usr/bin/env node

import Bluebird from 'bluebird';
import Commander from 'commander';
import Yaml from 'js-yaml';

import FS from 'fs-extra';
import Path from 'path';

import { Generator } from '../index';

Bluebird.promisifyAll(FS);

const homePath = process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH;
const workingPath = process.cwd();

function collect(val, memo) {
    memo.push(val);
    return memo;
}

(async function run() {
    let pack = require('../package.json');
    
    Commander
        .version(pack.version)
        .usage('[options] <manifest>')
        .parse(process.argv);
    
    let manifestPath = Path.resolve(workingPath, Commander.args[0]);
    let manifest = await FS.readFileAsync(manifestPath, 'utf8').then(content => Yaml.safeLoad(content));
    
    let targetsPath = Path.resolve(homePath, `.${pack.name}`, 'targets');
    let templatesPath = workingPath;
    
    let generator = new Generator(manifest, targetsPath, templatesPath);
    
    await generator.generateAsync();
})().catch((err) => {
    console.error(err);
});