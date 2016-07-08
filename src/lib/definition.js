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
        return {
            name: this.name,
            options: this.options,
            enums: this.enums.map(e => e.resolveContext()),
            contracts: this.contracts.map(e => e.resolveContext()),
            models: this.models.map(e => e.resolveContext()),
            services: this.services.map(e => e.resolveContext()),

            extensions: _.assign({}, this.extensions),

            context: context
        };
    }
}

class Enum {
    constructor(manifest, props) {
        this.manifest = manifest;

        this.name = props.name;
        this.values = props.values ? _.clone(props.values) : {};
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext() {
        return {
            name: this.name,
            values: _.clone(this.values),

            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}
class Contract {
    constructor(manifest, props) {
        this.manifest = manifest;

        this.name = props.name;
        this.properties = _.map(props.properties || [], props => new ContractProperty(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext() {
        return {
            name: this.name,
            properties: this.properties.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}
class Model {
    constructor(manifest, props) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.properties = _.map(props.properties || [], props => new ModelProperty(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
        this.contracts = props.contracts ? _.clone(props.contracts) : {};

        let manifestContracts = this.getContracts();
        for (let contract of manifestContracts) {
            for (let prop of contract.properties) {
                let existingProp = _.find(this.properties, existingProp => existingProp.name === prop.name);
                if (!existingProp) {
                    this.properties.push(new ModelProperty(this, prop));
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

    resolveContext() {
        return {
            name: this.name,
            contracts: _.clone(this.contracts),
            properties: this.properties.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}
class Service {
    constructor(manifest, props) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.methods = _.map(props.methods || [], props => new ServiceMethod(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext() {
        return {
            name: this.name,
            methods: this.methods.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}

class ContractProperty {
    constructor(contract, props) {
        this.contract = contract;

        this.name = props.name;
        this.type = props.type;
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext() {
        return {
            name: this.name,
            type: this.type,
            
            extensions: _.assign({}, this.contract.manifest.extensions, this.contract.extensions, this.extensions)
        };
    }
}
class ModelProperty {
    constructor(model, props) {
        this.model = model;

        this.name = props.name;
        this.type = props.type;
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext() {
        return {
            name: this.name,
            type: this.type,
            
            extensions: _.assign({}, this.model.manifest.extensions, this.model.extensions, this.extensions)
        };
    }
}

class ServiceMethod {
    constructor(service, props) {
        this.service = service;

        this.name = props.name;
        this.returnType = props.returnType;
        this.params = _.map(props.params || [], props => new MethodParam(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext() {
        return {
            name: this.name,
            returnType: this.returnType,
            params: this.params.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.service.manifest.extensions, this.service.extensions, this.extensions)
        };
    }
}
class MethodParam {
    constructor(manifest, props) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.type = props.type;
    }

    resolveContext() {
        return {
            name: this.name,
            type: this.type
        };
    }
}