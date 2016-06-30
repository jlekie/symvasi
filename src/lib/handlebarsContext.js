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

    handlebars.registerHelper('format', (value, ...params) => {
        params.pop();
        
        return value ? new Handlebars.SafeString(Util.format(value.toString(), ...params)) : '';
    });
    
    handlebars.registerHelper('getListType', function getListType(type, options) {
        if (_.startsWith(type.toString(), 'list:')) {
            return new Handlebars.SafeString(type.toString().slice(5));
        }
        else {
            return '';
        }
    });
    
    handlebars.registerHelper('isType', function isType(type, targetType, options) {
        if (type.toString() === targetType) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeString', function isTypeString(type, options) {
        switch (type.toString()) {
            case 'str':
            case 'string':
                return options.fn(this);
            default:
                return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeBoolean', function isTypeBoolean(type, options) {
        switch (type.toString()) {
            case 'bool':
            case 'boolean':
                return options.fn(this);
            default:
                return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeInteger', function isTypeInteger(type, options) {
        switch (type.toString()) {
            case 'int':
            case 'integer':
                return options.fn(this);
            default:
                return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeFloat', function isTypeFloat(type, options) {
        switch (type.toString()) {
            case 'float':
            case 'single':
                return options.fn(this);
            default:
                return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeDouble', function isTypeDouble(type, options) {
        switch (type.toString()) {
            case 'double':
                return options.fn(this);
            default:
                return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeByte', function isTypeByte(type, options) {
        switch (type.toString()) {
            case 'byte':
                return options.fn(this);
            default:
                return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeEnum', function isTypeEnum(type, options) {
        let { root: definition } = options.data;
        
        if (_.some(definition.enums, e => e.name === type.toString())) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeModel', function isTypeModel(type, options) {
        let { root: definition } = options.data;
        
        if (_.some(definition.models, e => e.name === type.toString())) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeList', function isTypeList(type, options) {
        let { root: definition } = options.data;
        
        if (_.startsWith(type.toString(), 'list:')) {
            return options.fn(this);
        }
        else {
            return options.inverse(this);
        }
    });
    handlebars.registerHelper('isTypeAny', function isTypeAny(type, options) {
        let { root: definition } = options.data;
        
        switch (type.toString()) {
            case 'any':
                return options.fn(this);
            default:
                return options.inverse(this);
        }
    });
    
    return handlebars;
}