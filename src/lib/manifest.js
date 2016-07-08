// @flow

// Declare the private dataset.
const privData = new WeakMap();
function priv(ctx) { return privData.get(ctx); }

export default class Manifest {
    builds: Object[];
    
    constructor(props: Object) {
        privData.set(this, {});
        
        this.builds = props.builds || [];
    }
}