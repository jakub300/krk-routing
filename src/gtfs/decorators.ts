/* eslint-disable no-underscore-dangle, no-param-reassign */

// type Clazz = { new (): Object };

interface Constructable<T> {
  new (): T;
}

interface Clazz extends Constructable<Object> {}

interface GTFSClass {
  [key: string]: any;
}

const GTFS_FIELDS = Symbol('gtfsFields');
const GTFS_PREFIX = Symbol('gtfsPrefix');

type gtfsFieldProperties = {
  name: string;
  parser?: Function;
  prefixable: boolean;
  deserializer?: Function;
};
interface GTFSClassStatic {
  [GTFS_FIELDS]?: { [name: string]: gtfsFieldProperties | undefined };
  [GTFS_PREFIX]?: string;
}

let resolvers: Map<Clazz, Function> | { [name: string]: Function } = new Map();

function nameOrKey(name: string, key: string): { prefixable: boolean; name: string } {
  if (name) {
    return { prefixable: false, name };
  }

  return {
    prefixable: true,
    name: key.replace(
      /([a-z])([A-Z])/g,
      (_, l1: string, l2: string) => `${l1}_${l2.toLowerCase()}`,
    ),
  };
}

function assignParserToField(
  clazz: GTFSClassStatic,
  key: string,
  { prefixable, name }: { prefixable: boolean; name: string },
  parser?: Function,
  deserializer?: Function,
) {
  const fields = clazz[GTFS_FIELDS] || {};
  fields[key] = { name, parser, prefixable, deserializer };
  clazz[GTFS_FIELDS] = fields;
}

export function importObject<T>(
  Clazz: Constructable<T & GTFSClass> & GTFSClassStatic,
  data: { [key: string]: any },
  res: Map<Clazz, Function> | null = null,
): T {
  const oldResolvers = resolvers;
  if (res) {
    resolvers = res;
  }

  const obj = new Clazz();
  const prefix = Clazz[GTFS_PREFIX] || '';
  const fields = Clazz[GTFS_FIELDS] || {};

  Object.entries(fields).forEach(([key, field]) => {
    if (!field || !field.parser) {
      return;
    }

    let { name } = field;
    if (field.prefixable && prefix) {
      name = `${prefix}${name}`;
    }
    const val = data[name];

    // console.log(`Loading ${name} (${val}) to ${key}`);

    obj[key] = field.parser(val);
  });

  resolvers = oldResolvers;

  return obj;
}

const fieldsForClasses: { [name: string]: [string, gtfsFieldProperties | undefined][] } = {};
export function indexFieldsForClasses(classes: (Constructable<GTFSClass> & GTFSClassStatic)[]) {
  classes.forEach(Clazz => {
    fieldsForClasses[Clazz.name] = Object.entries(Clazz[GTFS_FIELDS] || {});
  });
}

export function deserializeObject<T>(
  Clazz: Constructable<T & GTFSClass> & GTFSClassStatic,
  data: { [key: string]: any },
  res: { [name: string]: Function } | null = null,
): T {
  const oldResolvers = resolvers;
  if (res) {
    resolvers = res;
  }

  const obj = new Clazz();
  const fields = Clazz[GTFS_FIELDS] || {};

  fieldsForClasses[Clazz.name].forEach(([key, field]) => {
    if (!field || !Object.prototype.hasOwnProperty.call(data, key)) {
      return;
    }

    const val = data[key];
    obj[key] = field.deserializer ? field.deserializer(val) : val;
  });

  resolvers = oldResolvers;

  return obj;
}

export function gtfsPrefix(prefix: string): Function {
  return (Clazz: GTFSClassStatic) => {
    Clazz[GTFS_PREFIX] = prefix;
  };
}

export function gtfsString(name: string = ''): Function {
  return ({ constructor }: { constructor: GTFSClassStatic }, key: string) => {
    assignParserToField(constructor, key, nameOrKey(name, key), (v: any) => String(v));
  };
}

export function gtfsNumber(name: string = ''): Function {
  return ({ constructor }: { constructor: GTFSClassStatic }, key: string) => {
    assignParserToField(constructor, key, nameOrKey(name, key), (v: any) => Number(v));
  };
}

export function gtfsReference(Clazz: Clazz, name: string = ''): Function {
  return ({ constructor }: { constructor: GTFSClassStatic }, key: string) => {
    assignParserToField(
      constructor,
      key,
      nameOrKey(name, key),
      (v: any) => {
        if (!(resolvers instanceof Map)) {
          return undefined;
        }

        const resolver = resolvers.get(Clazz);
        return resolver ? resolver(v) : undefined;
      },
      (v: any) => {
        const resolver = (resolvers as any)[Clazz.name];
        if (!resolver) {
          throw new Error('No resolver for class');
        }
        const ret = resolver ? resolver(v) : undefined;
        if (ret === undefined) {
          throw new Error('Failed to resolve');
        }
        return ret;
      },
    );
  };
}

const gtfsTimeMultipliers = [60 * 60, 60, 1];
export function gtfsTime(name: string = ''): Function {
  return ({ constructor }: { constructor: GTFSClassStatic }, key: string) => {
    assignParserToField(constructor, key, nameOrKey(name, key), (v: any) => {
      const parts = String(v).split(':');
      const numbers = parts.map(n => parseInt(n, 10));

      if (!(parts.length === 3 && !numbers.some(n => Number.isNaN(n)))) {
        throw new Error(`Bad time ${v}`);
      }

      return numbers.reduce((sum, n, index) => sum + n * gtfsTimeMultipliers[index], 0);
    });
  };
}

export function gtfsDecodeOnly(): Function {
  return ({ constructor }: { constructor: GTFSClassStatic }, key: string) => {
    assignParserToField(constructor, key, nameOrKey('', key));
  };
}
