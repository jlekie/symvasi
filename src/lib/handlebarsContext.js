import _ from 'lodash';
import Handlebars from 'handlebars';
import Swag from 'swag';

import Path from 'path';
import Util from 'util';

export default function createHandlebars() {
    let handlebars = Handlebars.create();

    Swag.registerHelpers(handlebars);
    
    handlebars.registerHelper('lowerCase', value => value ? new Handlebars.SafeString(value.toString().toLowerCase()) : '');
    handlebars.registerHelper('upperCase', value => value ? new Handlebars.SafeString(value.toString().toUpperCase()) : '');
    handlebars.registerHelper('lowerCaseFirst', value => value ? new Handlebars.SafeString(_.lowerFirst(value.toString())) : '');
    handlebars.registerHelper('upperCaseFirst', value => value ? new Handlebars.SafeString(_.upperFirst(value.toString())) : '');
    handlebars.registerHelper('camelCase', value => value ? new Handlebars.SafeString(_.camelCase(value.toString())) : '');
    handlebars.registerHelper('kebabCase', value => value ? new Handlebars.SafeString(_.kebabCase(value.toString())) : '');
    handlebars.registerHelper('snakeCase', value => value ? new Handlebars.SafeString(_.snakeCase(value.toString())) : '');
    handlebars.registerHelper('resolvePath', value => value ? new Handlebars.SafeString(Path.resolve(value.toString())) : '');
    
    handlebars.registerHelper('isObject', function isType(type, options) {
        if (_.isObject(type)) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });

    handlebars.registerHelper('extension', function extension(extensionName, options) {
        return this.extensions[extensionName] ? new Handlebars.SafeString(this.extensions[extensionName].toString()) : '';
    });
    handlebars.registerHelper('ifExtension', function extension(extensionName, options) {
        let extensionValue = this.extensions[extensionName];

        if (extensionValue) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });

    handlebars.registerHelper('format', function format(value, ...params) {
        params.pop();
        
        return value ? new Handlebars.SafeString(Util.format(value.toString(), ...params)) : '';
    });
    
    handlebars.registerHelper('getListType', function getListType(...params) {
        params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'list') {
            return this.itemType.dataType;
        }
        else {
            return '';
        }
    });

    handlebars.registerHelper('isTypeNullable', function isTypeNullable(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.nullable) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    
    handlebars.registerHelper('isType', function isType(...params) {
        let options = params.pop();
        let targetType = params.shift();
        let ctx = params.shift() || this;

        if (ctx.dataType === targetType) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeString', function isTypeString(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'string') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeBoolean', function isTypeBoolean(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'boolean') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeInteger', function isTypeInteger(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'integer') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeFloat', function isTypeFloat(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'float') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeDouble', function isTypeDouble(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'double') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeByte', function isTypeByte(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'byte') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeEnum', function isTypeEnum(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'enum') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeModel', function isTypeModel(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'model') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeList', function isTypeList(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'list') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeAny', function isTypeAny(...params) {
        let options = params.pop();
        let ctx = params.shift() || this;

        if (ctx.dataType === 'any') {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    
    return handlebars;
}