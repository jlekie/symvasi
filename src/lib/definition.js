// Declare the private dataset.
const privData = new WeakMap();
function priv(ctx) { return privData.get(ctx); }

export default class Manifest {
    constructor(name, props) {
        privData.set(this, {});
        
        for (var propKey in props) {
            this[propKey] = props[propKey];
        }
        
        priv(this).name = name;
    }
    
    get name() { return priv(this).name; }
}