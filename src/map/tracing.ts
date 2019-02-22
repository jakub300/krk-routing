type TraceInProgress = [string, boolean, number];
type TraceSaved = [string, number, string];
let traces: TraceSaved[] = [];
let tracesGroups: { [key: string]: number } = {};
let tracesGroupsParents: { [key: string]: string } = {};
let tracesInProgress: TraceInProgress[] = [];

export function startTrace(name: string, group = false) {
  tracesInProgress.push([name, group, performance.now()]);
  return name;
}

export function stopTrace(name: string) {
  const end = performance.now();
  if (tracesInProgress[tracesInProgress.length - 1][0] !== name) {
    throw new Error('bad end');
  }
  const [_, group, start] = tracesInProgress.pop() as TraceInProgress;
  const [parentName] = tracesInProgress[tracesInProgress.length - 1] || [''];

  const diff = end - start;

  if (group) {
    if (!tracesGroups[name]) {
      tracesGroups[name] = 0;
      tracesGroupsParents[name] = parentName;
    }

    tracesGroups[name] += diff;
  } else {
    traces.push([name, diff, parentName]);
  }
}

export function printTraces() {
  console.log(traces);
  console.log(tracesGroups);
}

export function resetTracing() {
  traces = [];
  tracesGroups = {};
  tracesGroupsParents = {};
  tracesInProgress = [];
}
