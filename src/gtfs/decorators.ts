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

type gtfsFieldProperties = { name: string; parser: Function; prefixable: boolean };
interface GTFSClassStatic {
  [GTFS_FIELDS]?: { [name: string]: gtfsFieldProperties | undefined };
  [GTFS_PREFIX]?: string;
}

let resolvers: Map<Clazz, Function> = new Map();

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
  parser: Function,
) {
  const fields = clazz[GTFS_FIELDS] || {};
  fields[key] = { name, parser, prefixable };
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
    if (!field) {
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
    assignParserToField(constructor, key, nameOrKey(name, key), (v: any) => {
      const resolver = resolvers.get(Clazz);
      return resolver ? resolver(v) : undefined;
    });
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
