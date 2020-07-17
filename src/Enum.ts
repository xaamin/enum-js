import InvalidEnumError from './InvalidEnumError';

class Enum {

  public enum: object | Array<string | number> = {};

  private _name: string | null = null;
  private _value: any = null;

  static _cached: any = {};

  constructor() {
    this._getProxied = this._getProxied.bind(this);

    return new Proxy(this, {
      get: this._getProxied
    })
  }

  boot(name: string | null = null, value: any = null) {
    this._fill(this.enum);

    if (name !== null) {
      const entry = value === null ? this._getValueFromCache(name) : null;

      this._name = entry !== null ? entry.name : name;
      this._value = value === null ? entry.value : value;
    }

    return this;
  }

  static make(name: string | null = null, value: any = null) {
    const instance = new this();

    instance.boot(name, value);

    return instance;
  }

  static isValid(name: string) {
    const value = (new this()).boot()._resolve(name);

    return !!value && !!value.name;
  }

  static isValidValue(value: string | number, strict: boolean = false) {
    return this.search(value, strict) !== null;
  }

  static all() {
    const cached = (new this()).boot()._resolve();
    let all: any = {};

    for (const value of Object.values(cached)) {
        all[(value as any).name] = (value as any).value;
    }

    return all;
  }

  static keys() {
    return Object.values((new this()).boot()._resolve()).map((item: any) => item.name);
  }

  static values() {
    return Object.values((new this()).boot()._resolve());
  }

  static search(value: string | number, strict: boolean = false) {
    const values = Object.values((new this()).boot()._resolve());

    let match: any = values.find((item: any) => {
      if (strict) {
        return item.value === value;
      }

      return ('' + value).toLocaleLowerCase() === ('' + item.value).toLocaleLowerCase();
    });

    return !!match ? (new this).boot(match.name, match.value) : null;
  }

  static toJson() {
    return JSON.stringify(this.toObject());
  }

  static toObject() {
    return this.all();
  }

  getName() {
    return this._name;
  }

  getValue() {
    return this._value;
  }

  equals(name: string | Enum) {
    return this.isEqual(name);
  }

  isEqual(name: string | Enum) {
    let alias: string | null = '';

    if (name instanceof Enum) {
      alias = (name as Enum).getName();
    } else {
      alias = name;
    }

    return ('' + alias).toLowerCase() === ('' + this.getName()).toLowerCase();
  }

  toString() {
    const value = this.getValue();

    if (value !== null && typeof value === 'object') {
      return value.value;
    }

    return value;
  }

  _fill(values: object | Array<string | number>) {
    if (Enum._cached[this.constructor.name]) {
      return;
    }

    this._resolve();
    let _enum: any = {};

    if (Array.isArray(values)) {
      for (const value of values) {
        _enum[(value as any)] = (value as any);
      }
    } else {
      _enum = Object.assign({}, values);
    }

    const keys = Object.keys(_enum);

    for (const key of keys) {
      const value = _enum[key];

      if (typeof value === 'object') {
        this._setValueForName(value.name, value.value, value.meta);
      } else {
        this._setValueForName(key, value);
      }
    }
  }

  _resolve(name: string | null = null) {
    const alias = this.constructor.name;

    if (!Enum._cached[alias]) {
      Enum._cached[alias] = [];
    }

    if (!name) {
      return Enum._cached[alias];
    }

    name = name.toUpperCase();

    if (!Enum._cached[alias][name]) {
      Enum._cached[alias][name] = {};
    }

    return Enum._cached[alias][name];
  }

  _setValueForName(name: string, value: any, meta: any = undefined) {
      const alias = name.toUpperCase();

      Enum._cached[this.constructor.name][alias] = this._makeValueForName(name, value, meta);
  }

  _makeValueForName(name: string, value: any, meta: any) {
      return {
          name,
          value,
          meta
      };
  }

  _getProxied(target: Enum, name: string){
    if (name in target) {
      return (target as any)[name];
    }

    if (this._startsWith(name, 'is')) {
      name = name.substring(2);

      return () => this.equals(name);
    }

    const instance = new (this as any).constructor(name);

    instance.boot(name);

    return () => instance;
  }

  _startsWith(haystack: string, needle: string) {
      return haystack.length > 2 && haystack.indexOf(needle) === 0;
  }

  _getValueFromCache(name: string) {
    const entry = this._resolve(name);

    if (!entry || !entry.name) {
      const message = `The given name [${name}] is not available in this enum ${this.constructor.name}`;

      throw new InvalidEnumError(message);
    }

    return entry;
  }

}

export default Enum;