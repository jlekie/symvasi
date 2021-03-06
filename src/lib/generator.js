// @flow

type Privs = { buildPromise?: Promise<Object[]> }

import _ from 'lodash';
import Bluebird from 'bluebird';
import Yaml from 'js-yaml';
import Glob from 'glob';
import Logquacious from 'logquacious';

import FS from 'fs-extra';
import Path from 'path';
import Util from 'util';

import Definition from './definition';
import Handlebars from './handlebars';
import HandlebarsContext from './handlebarsContext';

const logger = new Logquacious('symvasi');

Bluebird.promisifyAll(FS);
const GlobAsync = Bluebird.promisify(Glob);

// Declare the private dataset.
const privData = new WeakMap();
function priv(ctx): Privs { return privData.get(ctx); }

type ParsedBuild = {
    targets: Object[],
    definitions: Definition[],
    augmentations: Definition[],
    output: string
}

async function parseBuildsAsync(builds: Object[], targetsPath: string, templatesPath: string): Promise<ParsedBuild[]> {
    let targets = _(builds)
        .map(b => b.targets)
        .flatten()
        .value();
    
    let compiledTargets = await Bluebird.map(targets, async (target) => {
        let targetPath = Path.resolve(targetsPath, target);
        
        let handlebars = HandlebarsContext();
        
        let targetParamsPath = Path.resolve(targetPath, 'params.yml');
        let targetParams = await FS.readFileAsync(targetParamsPath, 'utf8').then(content => Yaml.safeLoad(content));
        
        let partialsPath = Path.resolve(targetPath, 'partials');
        let partialsGlobPath = Path.resolve(partialsPath, '*.tpl');
        
        let partialsFilesPaths = await GlobAsync(partialsGlobPath);
        await Bluebird.map(partialsFilesPaths, async (partialFilePath) => {
            let partialPath = Path.relative(partialsPath, partialFilePath);
            partialPath = Path.basename(partialPath, '.tpl');
            
            await FS.readFileAsync(partialFilePath, 'utf8').then(content => handlebars.registerPartial(partialPath, content));
        });
        
        let outputsPath = Path.resolve(targetPath, 'outputs');
        let outputsGlobPath = Path.resolve(outputsPath, '**/*.tpl');
        
        let outputFilesPaths = await GlobAsync(outputsGlobPath);
        
        let compiledOutputs = await Bluebird.map(outputFilesPaths, async (outputFilePath) => {
            let compiledOutput = await FS.readFileAsync(outputFilePath, 'utf8').then(content => handlebars.compile(content));
            
            let outputPath = Path.relative(outputsPath, outputFilePath);
            outputPath = outputPath.slice(0, 0 - Path.basename(outputFilePath).length);
            
            let outputName = Path.relative(outputsPath, outputFilePath);
            outputName = outputName.slice(0, -4);
            
            // let outputName = Path.basename(outputFilePath, '.tpl');
            // if (outputName === 'main') { outputName = ''; }

            return [ outputName, {
                path: outputPath,
                compiledTemplate: compiledOutput
            }];
        }).then(_.fromPairs);
        
        return [ target, {
            params: targetParams,
            outputTemplates: compiledOutputs
        }];
    }).then(_.fromPairs);
    
    let parsedBuilds = await Bluebird.map(builds, async (build) => {
        let { targets, options, extensions, templates, augmentations, output } = build;
        
        let parsedAugmentations = {};
        let augmentationPaths = await Bluebird.map(augmentations || [], async (augmentation) => {
            let globPath = Path.resolve(templatesPath, augmentation);
            
            return await GlobAsync(globPath);
        }).then(_.flatten);
        await Bluebird.map(augmentationPaths, async (augmentationPath) => {
            let augmentationParams = await FS.readFileAsync(augmentationPath, 'utf8').then(content => Yaml.safeLoad(content));
            let augmentationName = Path.basename(augmentationPath, '.yml');
            let fqn = augmentationParams.fqn || augmentationName;

            parsedAugmentations[fqn] = augmentationParams;
        });

        let templatePaths = await Bluebird.map(templates, async (template) => {
            let globPath = Path.resolve(templatesPath, template);
            
            return await GlobAsync(globPath);
        }).then(_.flatten);
        let parsedDefinitions: Definition[] = await Bluebird.map(templatePaths, async (templatePath) => {
            let templateParams = await FS.readFileAsync(templatePath, 'utf8').then(content => Yaml.safeLoad(content));
            let templateName = Path.basename(templatePath, '.yml');
            let fqn = templateParams.fqn || templateName;

            if (parsedAugmentations[fqn]) {
                let augmentation = parsedAugmentations[fqn];

                templateParams.extensions = templateParams.extensions || {};
                _.assign(templateParams.extensions, augmentation.extensions || {});

                _.each(augmentation.models || [], (augmentedModel) => {
                    let model = _.find(templateParams.models, model => model.name === augmentedModel.name);

                    model.extensions = model.extensions || {};
                    _.assign(model.extensions, augmentedModel.extensions || {});

                    model.methods = model.methods || [];
                    for (let augmentedMethod of augmentedModel.methods || [])
                        model.methods.push(augmentedMethod);
                });
            }
            
            return new Definition(templateName, templateParams, options, extensions);
        });
        
        let parsedTargets = _.map(targets, t => compiledTargets[t]);
        
        let parsedOutput = Path.resolve(process.cwd(), output);
        
        return {
            targets: parsedTargets,
            definitions: parsedDefinitions,
            augmentations: null,
            output: parsedOutput
        };
    });
    
    return parsedBuilds;
}

export default class Generator {
    constructor(manifest: Object, targetsPath: string, templatesPath: string) {
        privData.set(this, {});
        
        let { builds } = manifest;
        
        logger.debug('Parsing builds...');
        priv(this).buildPromise = parseBuildsAsync.call(this, builds, targetsPath, templatesPath);
    }
    
    async generateAsync(): Promise<any> {
        let builds: ?ParsedBuild[] = await priv(this).buildPromise;

        let handlebars = HandlebarsContext();
        
        await Bluebird.map(builds, async (build: ParsedBuild) => {
            let { targets, definitions, output } = build;
            
            await Bluebird.map(targets, async (target) => {
                let { outputs: targetOutputs } = target.params;
                
                await Bluebird.map(targetOutputs, async (targetOutput) => {
                    let outputTemplate = target.outputTemplates[targetOutput.templateName];
                    if (!outputTemplate) {
                        throw new Error(`Output template '${targetOutput.templateName}' not defined`);
                    }

                    await Bluebird.map(definitions, async (definition: Definition) => {
                        let context = definition;
                        if (targetOutput.context) {
                            context = _.get(context, targetOutput.context);
                            if (!context) {
                                throw new Error(`Context "${targetOutput.context}" failed to resolve`);
                            }
                        }

                        if (_.isArray(context)) {
                            await Bluebird.map(context, async (itemContext) => {
                                let normalizedContext = definition.resolveContext(itemContext);

                                let outputPathTemplate = handlebars.compile(targetOutput.path);
                                let outputPath = Path.resolve(output, outputPathTemplate(normalizedContext));
                                
                                logger.info(`Generating output for ${outputPath}...`);
                                
                                let generatedFile = outputTemplate.compiledTemplate(normalizedContext);
                                await FS.outputFileAsync(outputPath, generatedFile);
                            });
                        }
                        else {
                            let normalizedContext = definition.resolveContext(context);
                            
                            let outputPathTemplate = handlebars.compile(targetOutput.path);
                            let outputPath = Path.resolve(output, outputPathTemplate(normalizedContext));
                            
                            logger.info(`Generating output for ${outputPath}...`);
                            
                            let generatedFile = outputTemplate.compiledTemplate(normalizedContext);
                            await FS.outputFileAsync(outputPath, generatedFile);
                        }
                    });
                });
            });
        });
    }
}