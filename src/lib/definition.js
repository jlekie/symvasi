import _ from 'lodash';

// Declare the private dataset.
const privData = new WeakMap();
function priv(ctx) { return privData.get(ctx); }

export default class Manifest {
    constructor(name, props, options) {
        privData.set(this, {});
        
        for (var propKey in props) {
            this[propKey] = props[propKey];
        }

        if (!this.options) { this.options = {}; }
        _.assign(this.options, options);
        
        priv(this).name = name;
    }
    
    get name() { return priv(this).name; }
}