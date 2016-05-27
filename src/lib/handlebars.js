import _ from 'lodash';
import Handlebars from 'handlebars';

import Path from 'path';
import Util from 'util';

const handlebars = Handlebars.create();

handlebars.registerHelper('lowerCase', value => value ? new Handlebars.SafeString(value.toString().toLowerCase()) : '');
handlebars.registerHelper('upperCase', value => value ? new Handlebars.SafeString(value.toString().toUpperCase()) : '');
handlebars.registerHelper('lowerCaseFirst', value => value ? new Handlebars.SafeString(_.lowerFirst(value.toString())) : '');
handlebars.registerHelper('upperCaseFirst', value => value ? new Handlebars.SafeString(_.upperFirst(value.toString())) : '');
handlebars.registerHelper('camelCase', value => value ? new Handlebars.SafeString(_.camelCase(value.toString())) : '');
handlebars.registerHelper('kebabCase', value => value ? new Handlebars.SafeString(_.kebabCase(value.toString())) : '');
handlebars.registerHelper('snakeCase', value => value ? new Handlebars.SafeString(_.snakeCase(value.toString())) : '');
handlebars.registerHelper('resolvePath', value => value ? new Handlebars.SafeString(Path.resolve(value.toString())) : '');

handlebars.registerHelper('format', (value, ...params) => {
    params.pop();
    
    return value ? new Handlebars.SafeString(Util.format(value.toString(), ...params)) : '';
});

handlebars.registerHelper('isType', function isType(type, options) {
    if (this.type === type) {
        return options.fn(this);
    }
    else {
        return options.inverse(this);
    }
});
handlebars.registerHelper('isTypeString', function isTypeString(options) {
    switch (this.type) {
        case 'str':
        case 'string':
            return options.fn(this);
        default:
            return options.inverse(this);
    }
});
handlebars.registerHelper('isTypeBoolean', function isTypeBoolean(options) {
    switch (this.type) {
        case 'bool':
        case 'boolean':
            return options.fn(this);
        default:
            return options.inverse(this);
    }
});
handlebars.registerHelper('isTypeInteger', function isTypeInteger(options) {
    switch (this.type) {
        case 'int':
        case 'integer':
            return options.fn(this);
        default:
            return options.inverse(this);
    }
});
handlebars.registerHelper('isTypeFloat', function isTypeFloat(options) {
    switch (this.type) {
        case 'float':
        case 'single':
            return options.fn(this);
        default:
            return options.inverse(this);
    }
});
handlebars.registerHelper('isTypeDouble', function isTypeDouble(options) {
    switch (this.type) {
        case 'double':
            return options.fn(this);
        default:
            return options.inverse(this);
    }
});
handlebars.registerHelper('isTypeEnum', function isTypeEnum(options) {
    let { enums } = this;
    
    if (_.some(enums, e => e.name === this.type)) {
        return options.fn(this);
    }
    else {
        return options.inverse(this);
    }
});

export default handlebars;