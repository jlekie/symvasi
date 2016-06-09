var _ = require('lodash');
var fs = require('fs-extra');

var gulp = require('gulp');
var through = require('through2');

var watch = require('gulp-watch');
var sequence = require('gulp-sequence');
var plumber = require('gulp-plumber');
var nodemon = require('gulp-nodemon');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var eslint = require('gulp-eslint');
var mocha = require('gulp-mocha');
var flow = require('gulp-flowtype');

// var jshintStylish = require('jshint-stylish');

var babelOptions = {
    presets: [ 'es2015', 'stage-2' ],
    plugins: [
        'syntax-flow',
        'transform-flow-strip-types',
        ['transform-runtime', { polyfill: false }],
        'transform-class-properties',
        [ 'transform-async-to-module-method', { module: 'bluebird', method: 'coroutine' } ]
    ]
}

var targets = {
    'manifests': {
        paths: [ 'package.json', 'README.md', 'LICENSE' ],
        buildTask: function () {
            return gulp.src(this.paths)
                .pipe(gulp.dest('dist'));
        }
    },
    
    'src': {
        eslint: true,
        paths: [ './src/index.js' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src' })
                .pipe(plumber())
                .pipe(sourcemaps.init())
                    .pipe(babel(babelOptions))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest('dist'));
        }
    },
    'src/bin': {
        eslint: true,
        paths: [ './src/bin/*.js' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src' })
                .pipe(plumber())
                .pipe(sourcemaps.init())
                    .pipe(babel(babelOptions))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest('dist'));
        }
    },
    'src/lib': {
        eslint: true,
        paths: [ './src/lib/**/*.js' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src' })
                .pipe(plumber())
                .pipe(sourcemaps.init())
                    .pipe(babel(babelOptions))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest('dist'));
        }
    },
    'src/lib/modules': {
        eslint: true,
        paths: [ './src/modules/**/*.js' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src/lib/modules' })
                .pipe(plumber())
                .pipe(sourcemaps.init())
                    .pipe(babel(babelOptions))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest('dist/lib/node_modules'));
        }
    },
    'src/modules/manifests': {
        paths: [ './src/lib/modules/**/*.json' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src/lib/modules' })
                .pipe(gulp.dest('dist/lib/node_modules'));
        }
    },
    'src/test': {
        eslint: true,
        paths: [ './src/test/**/*.js' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src' })
                .pipe(plumber())
                .pipe(sourcemaps.init())
                    .pipe(babel(babelOptions))
                .pipe(sourcemaps.write('.'))
                .pipe(gulp.dest('dist'));
        }
    },
    'src/test/cfg': {
        paths: [ './src/test/**/*.yml' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src' })
                .pipe(gulp.dest('dist'));
        }
    },
    
    'src/cfg': {
        paths: [ './src/cfg/*.yml' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src' })
                .pipe(gulp.dest('dist'));
        }
    },
};

targets.eslint = {
    paths: _(targets)
        .filter(function (target) { return target.eslint })
        .map(function (target) { return target.paths })
        .flatten()
        .tap(function (targets) { targets.splice(0, 0, '.eslintrc') })
        .value(),
    restart: false,
    buildTask: function () {
        return gulp.src(_(targets)
                .filter(function (target) { return target.eslint })
                .map(function (target) { return target.paths })
                .flatten()
                .value())
            .pipe(eslint())
            .pipe(eslintInterceptor())
            .pipe(eslint.format());
            // .pipe(eslint.failAfterError());
    }
};
targets.flow = {
    paths: [ './src/**/*.js' ],
    restart: false,
    buildTask: function () {
        return gulp.src([ './src/**/*.js' ])
            .pipe(flow({
                all: false,
                weak: false,
                killFlow: false,
                abort: false,
                // reporter: {
                //     reporter: function (results, config, options) {
                //         var filteredResult = _.filter(results, function (result) {
                //             return result.file && result.file !== '';
                //         });

                //         return jshintStylish.reporter(results, config, options);
                //     }
                // }
            }));
            // .pipe(eslint.failAfterError());
    }
};

gulp.task('watch', function () {
    _.each(targets, function (target, key) {
        if (target.paths) {
            watch(target.paths, function () { sequence('rebuild[' + key + ']')() });
        }
    });
    
    // return nodemon({
    //     script: 'dist/index.js',
    //     // ext: 'yml',
    //     watch: [ 'dist/timestamp' ],
    //     delay: 2000,
    //     // args: passthroughArgs,
    //     execMap: {
    //         js: 'node_modules/mocha/bin/mocha dist/test'
    //     }
    // });
});

gulp.task('build', function (cb) {
    sequence('build[clean]', _.map(targets, function (target, key) { return 'build[' + key + ']' }), 'build[timestamp]')(cb);
});
gulp.task('build[clean]', function (cb) {
    fs.emptyDir('dist', cb);
});
gulp.task('build[timestamp]', function (cb) {
    fs.writeFile('dist/timestamp', new Date().getTime().toString(), cb);
});
_.each(targets, function (target, key) {
    if (target.dependencies) {
        gulp.task('build[' + key + ']', _.map(target.dependencies, function (dep) { return 'build[' + dep + ']' }), _.bind(target.buildTask, target));
    }
    else {
        gulp.task('build[' + key + ']', _.bind(target.buildTask, target));
    }
});
_.each(targets, function (target, key) {
    gulp.task('rebuild[' + key + ']', function (cb) {
        if (target.restart === false) {
            sequence('build[' + key + ']')(cb);
        }
        else {
            sequence('build[' + key + ']', 'build[timestamp]')(cb);
        }
    });
});

gulp.task('test', [ 'build' ], function () {
    return gulp.src('dist/test/**/*.js', { read: false })
        .pipe(mocha({ reporter: 'nyan' }));
})

gulp.task('default', function (cb) {
    sequence('build', 'monitor')(cb);
});

function cleanBabel(options) {
    return babel(parseBabelOptions(options));
}
function parseBabelOptions(options) {
    var pluginOptions = options.pluginOptions || {};
    
    return _.transform(options, function (result, value, key) {
        switch (key) {
            case 'presets':
                result[key] = _.map(value, function (preset) {
                    return require('babel-preset-' + preset);
                })
                break;
            case 'plugins':
                result[key] = _.map(value, function (plugin) {
                    if (pluginOptions[plugin]) {
                        return [ plugin, pluginOptions[plugin] ];
                    }
                    else {
                        return plugin;
                    }
                })
                break;
            case 'pluginOptions':
                break;
            default:
                result[key] = value;
                break;
        }
    }, {});
}

function eslintInterceptor() {
    var stream = through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            return cb(null, file);
        }
        else if (file.isStream()) {
            return cb(new Error('Streaming not supported'));
        }
        
        var data = file.eslint;
        
        data.messages = _.filter(data.messages, function (message) {
            switch (message.ruleId) {
                case 'semi':
                    if (message.source.substring(message.column, message.column + 1) === '}') { return false }
                    break;
            }
            
            return true;
        });
        
        return cb(null, file);
    });
    
    return stream;
}