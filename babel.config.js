const strip = ['startTrace', 'stopTrace', 'printTraces', 'resetTracing'];

const removeTracingPlugin = function removeTracingPlugin(babel) {
  const { types: t } = babel;

  return {
    name: 'remove-tracing-plugin',
    visitor: {
      CallExpression(path, state) {
        const callee = path.get('callee');
        const shouldStrip = strip.some(name => callee.isIdentifier({ name }));

        if (!shouldStrip) {
          return;
        }

        const binding = callee.scope.getBinding(callee.node.name);

        if (!binding || binding.kind !== 'module') {
          return;
        }

        path.replaceWith(t.unaryExpression('void', t.numericLiteral(0)));
      },
    },
  };
};

const plugins = [];

if (process.env.NODE_ENV === 'production') {
  plugins.push(removeTracingPlugin);
}

module.exports = {
  presets: ['@vue/app'],
  plugins,
};
