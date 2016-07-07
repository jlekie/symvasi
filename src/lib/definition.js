import _ from 'lodash';

// Declare the private dataset.
const privData = new WeakMap();
function priv(ctx) { return privData.get(ctx); }

export default class Definition {
    constructor(name, props, options = {}) {
        privData.set(this, {
            name: name
        });

        this.namespace = props.namespace;
        this.options = props.options ? _.cloneDeep(props.options) : {};
        this.enums = _.map(props.enums || [], props => new Enum(this, props));
        this.contracts = _.map(props.contracts || [], props => new Contract(this, props));
        this.models = _.map(props.models || [], props => new Model(this, props));
        this.services = _.map(props.services || [], props => new Service(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
        
        _.assign(this.options, options);
    }
    
    get name() { return priv(this).name; }

    resolveContext(context) {
        return _.defaults({ name: this.name, context: context }, this);
    }
}

class Enum {
    constructor(manifest, props) {
        this.manifest = manifest;

        this.name = props.name;
        this.values = props.values ? _.clone(props.values) : {};
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }
}
class Contract {
    constructor(manifest, props) {
        this.manifest = manifest;

        this.name = props.name;
        this.properties = _.map(props.properties || [], props => new Property(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }
}
class Model {
    constructor(manifest, props) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.properties = _.map(props.properties || [], props => new Property(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
        this.contracts = props.contracts ? _.clone(props.contracts) : {};

        let manifestContracts = this.getContracts();
        for (let contract of manifestContracts) {
            for (let prop of contract.properties) {
                let existingProp = _.find(this.properties, existingProp => existingProp.name === prop.name);
                if (!existingProp) {
                    this.properties.push(new Property(manifest, prop));
                }
                else {
                    if (existingProp.type !== prop.type) {
                        throw new Error(`Conflicting data types for contract property "${prop.name}"`);
                    }
                }
            }
        }
    }

    getContracts() {
        return _.map(this.contracts || [], (contractName) => {
            let contract = _.find(this.manifest.contracts, contract => contract.name === contractName);
            if (!contract) { throw new Error(`Contract "${contractName}" not defined`); }

            return contract;
        });
    }
}
class Service {
    constructor(manifest, props) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.methods = _.map(props.methods || [], props => new Method(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }
}

class Property {
    constructor(manifest, props) {
        this.manifest = manifest;

        this.name = props.name;
        this.type = props.type;
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }
}
class Method {
    constructor(manifest, props) {
        this.manifest = manifest;

        this.name = props.name;
        this.returnType = props.returnType;
        this.params = _.map(props.params || [], props => new MethodParam(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }
}
class MethodParam {
    constructor(manifest, props) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.type = props.type;
    }
}