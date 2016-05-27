// Declare the private dataset.
const privData = new WeakMap();
function priv(ctx) { return privData.get(ctx); }

export default class Manifest {
    constructor(props) {
        privData.set(this, {});
        
        for (var propKey in props) {
            this[propKey] = props[propKey];
        }
    }
}