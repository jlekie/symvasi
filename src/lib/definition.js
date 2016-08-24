// @flow

import _ from 'lodash';

// Declare the private dataset.
const privData = new WeakMap();
function priv(ctx) { return privData.get(ctx); }

export default class Definition {
    name: string;
    options: Object;
    enums: Enum[];
    contracts: Contract[];
    models: Model[];
    services: Service[];
    extensions: Object;

    enumNames: string[];
    modelNames: string[];

    constructor(name: string, props: Object, options: Object = {}) {
        privData.set(this, {
            name: name
        });

        this.enumNames = _.map(props.enums || [], e => e.name);
        this.modelNames = _.map(props.models || [], e => e.name);

        this.options = props.options ? _.cloneDeep(props.options) : {};
        this.enums = _.map(props.enums || [], props => new Enum(this, props));
        this.contracts = _.map(props.contracts || [], props => new Contract(this, props));
        this.models = _.map(props.models || [], props => new Model(this, props));
        this.services = _.map(props.services || [], props => new Service(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
        
        _.assign(this.options, options);
    }
    
    get name(): string { return priv(this).name; }

    resolveContext(context: any): Object {
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
    manifest: Definition;
    name: string;
    values: string[];
    extensions: Object;

    constructor(manifest: Definition, props: Object) {
        this.manifest = manifest;

        this.name = props.name;
        this.values = props.values ? _.clone(props.values) : [];
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext(): Object {
        return {
            name: this.name,
            values: _.clone(this.values),

            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}
class Contract {
    manifest: Definition;
    name: string;
    properties: ContractProperty[];
    extensions: Object;

    constructor(manifest: Definition, props: Object) {
        this.manifest = manifest;

        this.name = props.name;
        this.properties = _.map(props.properties || [], props => new ContractProperty(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext(): Object {
        return {
            name: this.name,
            properties: this.properties.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}
class Model {
    manifest: Definition;
    name: string;
    abstract: boolean;
    baseModel: string;
    properties: ModelProperty[];
    methods: ModelMethod[];
    contracts: string[];
    extensions: Object;

    constructor(manifest: Definition, props: Object) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.abstract = props.abstract;
        this.baseModel = props.baseModel;
        this.properties = _.map(props.properties || [], props => new ModelProperty(this, props));
        this.methods = _.map(props.methods || [], props => new ModelMethod(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
        this.contracts = props.contracts ? _.clone(props.contracts) : [];

        let manifestContracts = this.getContracts();
        for (let contract of manifestContracts) {
            for (let prop of contract.properties) {
                let existingProp = _.find(this.properties, existingProp => existingProp.name === prop.name);
                if (!existingProp) {
                    this.properties.push(prop.createModelProperty(this));
                }
                else {
                    if (existingProp.type !== prop.type) {
                        throw new Error(`Conflicting data types for contract property "${prop.name}"`);
                    }
                }
            }
        }
    }

    getContracts(): Contract[] {
        return _.map(this.contracts || [], (contractName) => {
            let contract = _.find(this.manifest.contracts, contract => contract.name === contractName);
            if (!contract) { throw new Error(`Contract "${contractName}" not defined`); }

            return contract;
        });
    }
    getBaseModel(): Model {
        let model = _.find(this.manifest.models, model => model.name === this.baseModel);
        if (!model) { throw new Error(`Base model "${this.baseModel}" not defined`); }

        return model;
    }

    resolveContext(): Object {
        return {
            name: this.name,
            abstract: this.abstract,
            baseModel: this.baseModel ? this.getBaseModel().resolveContext() : undefined,
            contracts: this.getContracts().map(e => e.resolveContext()),
            properties: this.properties.map(e => e.resolveContext()),
            methods: this.methods.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}
class Service {
    manifest: Definition;
    name: string;
    methods: ServiceMethod[];
    extensions: Object;

    constructor(manifest: Definition, props: Object) {
        this.manifest = manifest;
        
        this.name = props.name;
        this.methods = _.map(props.methods || [], props => new ServiceMethod(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext(): Object {
        return {
            name: this.name,
            methods: this.methods.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.manifest.extensions, this.extensions)
        };
    }
}

class ContractProperty {
    contract: Contract;
    name: string;
    type: DataType;
    extensions: Object;

    source: Object;

    constructor(contract: Contract, props: Object) {
        this.contract = contract;

        this.name = props.name;
        this.type = DataType.parseDataType(props.type, this.contract.manifest);
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};

        this.source = props;
    }

    createModelProperty(model: Model): ModelProperty {
        return new ModelProperty(model, this.source);
    }

    resolveContext(): Object {
        return {
            name: this.name,
            type: this.type.resolveContext(),
            
            extensions: _.assign({}, this.contract.manifest.extensions, this.contract.extensions, this.extensions)
        };
    }
}
class ModelProperty {
    model: Model;
    name: string;
    type: DataType;
    extensions: Object;

    constructor(model: Model, props: Object) {
        this.model = model;

        this.name = props.name;
        this.type = DataType.parseDataType(props.type, this.model.manifest);
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext(): Object {
        return {
            name: this.name,
            type: this.type.resolveContext(),
            
            extensions: _.assign({}, this.model.manifest.extensions, this.model.extensions, this.extensions)
        };
    }
}

class ModelMethod {
    model: Model;
    name: string;
    returnType: DataType;
    params: ModelMethodParam[];
    extensions: Object;

    constructor(model: Model, props: Object) {
        this.model = model;

        this.name = props.name;
        if (props.returnType) { this.returnType = DataType.parseDataType(props.returnType, this.model.manifest); }
        this.params = _.map(props.params || [], props => new ModelMethodParam(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext(): Object {
        return {
            name: this.name,
            returnType: this.returnType ? this.returnType.resolveContext() : undefined,
            params: this.params.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.model.manifest.extensions, this.model.extensions, this.extensions)
        };
    }
}
class ModelMethodParam {
    modelMethod: ModelMethod;
    name: string;
    type: DataType;

    constructor(modelMethod: ModelMethod, props: Object) {
        this.modelMethod = modelMethod;
        
        this.name = props.name;
        this.type = DataType.parseDataType(props.type, this.modelMethod.model.manifest);
    }

    resolveContext(): Object {
        return {
            name: this.name,
            type: this.type.resolveContext()
        };
    }
}

class ServiceMethod {
    service: Service;
    name: string;
    returnType: DataType;
    params: ServiceMethodParam[];
    extensions: Object;

    constructor(service: Service, props: Object) {
        this.service = service;

        this.name = props.name;
        if (props.returnType) { this.returnType = DataType.parseDataType(props.returnType, this.service.manifest); }
        this.params = _.map(props.params || [], props => new ServiceMethodParam(this, props));
        this.extensions = props.extensions ? _.cloneDeep(props.extensions) : {};
    }

    resolveContext(): Object {
        return {
            name: this.name,
            returnType: this.returnType ? this.returnType.resolveContext() : undefined,
            params: this.params.map(e => e.resolveContext()),
            
            extensions: _.assign({}, this.service.manifest.extensions, this.service.extensions, this.extensions)
        };
    }
}
class ServiceMethodParam {
    serviceMethod: ServiceMethod;
    name: string;
    type: DataType;

    constructor(serviceMethod: ServiceMethod, props: Object) {
        this.serviceMethod = serviceMethod;
        
        this.name = props.name;
        this.type = DataType.parseDataType(props.type, this.serviceMethod.service.manifest);
    }

    resolveContext(): Object {
        return {
            name: this.name,
            type: this.type.resolveContext()
        };
    }
}

class DataType {
    manifest: Definition;
    nullable: boolean;

    static parseDataType(dataType: string, manifest: Definition) {
        let normalizedDataType: string = _.trimEnd(dataType, '?');
        let nullable: boolean = _.endsWith(dataType, '?');

        switch (normalizedDataType) {
            case 'string':
                return new StringDataType(manifest, nullable);
            case 'bool':
            case 'boolean':
                return new BooleanDataType(manifest, nullable);
            case 'int':
            case 'integer':
                return new IntegerDataType(manifest, nullable);
            case 'float':
            case 'single':
                return new FloatDataType(manifest, nullable);
            case 'double':
                return new DoubleDataType(manifest, nullable);
            case 'byte':
                return new ByteDataType(manifest, nullable);
            case 'any':
                return new AnyDataType(manifest, nullable);
            default:
                if (_.some(manifest.enumNames, e => e === normalizedDataType)) {
                    return new EnumDataType(manifest, nullable, normalizedDataType);
                }
                else if (_.some(manifest.modelNames, e => e === normalizedDataType)) {
                    return new ModelDataType(manifest, nullable, normalizedDataType);
                }
                else if (_.startsWith(normalizedDataType, 'list:')) {
                    return new ListDataType(manifest, nullable, normalizedDataType.slice(5));
                }
                else {
                    throw new Error(`Type "${dataType}" not supported`);
                }
        }
    }

    constructor(manifest: Definition, nullable: boolean) {
        this.manifest = manifest;
        this.nullable = nullable;
    }

    resolveContext() {
        throw new Error('Not implemented');
    }
}
class StringDataType extends DataType {
    constructor(manifest: Definition, nullable: boolean) {
        super(manifest, nullable);
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'string'
        };
    }
}
class BooleanDataType extends DataType {
    constructor(manifest: Definition, nullable: boolean) {
        super(manifest, nullable);
    }
    
    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'boolean'
        };
    }
}
class IntegerDataType extends DataType {
    constructor(manifest: Definition, nullable: boolean) {
        super(manifest, nullable);
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'integer'
        };
    }
}
class FloatDataType extends DataType {
    constructor(manifest: Definition, nullable: boolean) {
        super(manifest, nullable);
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'float'
        };
    }
}
class DoubleDataType extends DataType {
    constructor(manifest: Definition, nullable: boolean) {
        super(manifest, nullable);
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'double'
        };
    }
}
class ByteDataType extends DataType {
    constructor(manifest: Definition, nullable: boolean) {
        super(manifest, nullable);
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'byte'
        };
    }
}
class EnumDataType extends DataType {
    enumName: string;

    constructor(manifest: Definition, nullable: boolean, enumName: string) {
        super(manifest, nullable);

        this.enumName = enumName;
    }

    getEnum(): Enum {
        let foundEnum = _.find(this.manifest.enums, e => e.name === this.enumName);
        if (!foundEnum) { throw new Error(`Enum "${this.enumName}" not defined`); }

        return foundEnum;
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'enum',
            enumName: this.getEnum().name
        };
    }
}
class ModelDataType extends DataType {
    modelName: string;

    constructor(manifest: Definition, nullable: boolean, modelName: string) {
        super(manifest, nullable);

        this.modelName = modelName;
    }

    getModel(): Model {
        let foundModel = _.find(this.manifest.models, e => e.name === this.modelName);
        if (!foundModel) { throw new Error(`Model "${this.modelName}" not defined`); }

        return foundModel;
    }

    resolveContext(): Object {
        let model = this.getModel();
        
        return {
            nullable: this.nullable,
            dataType: 'model',
            modelName: model.name,
            abstract: model.abstract
        };
    }
}
class ListDataType extends DataType {
    itemType: DataType;

    constructor(manifest: Definition, nullable: boolean, itemType: string) {
        super(manifest, nullable);

        this.itemType = DataType.parseDataType(itemType, manifest);
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'list',
            itemType: this.itemType.resolveContext()
        };
    }
}
class AnyDataType extends DataType {
    constructor(manifest: Definition, nullable: boolean) {
        super(manifest, nullable);
    }

    resolveContext(): Object {
        return {
            nullable: this.nullable,
            dataType: 'any'
        };
    }
}