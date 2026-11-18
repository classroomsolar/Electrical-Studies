// Terminal-current superposition. Both phasors point INTO the branch.
// A transformer changes current base and phase; a cable has equal/opposite currents.
export function combineBranchFlows(details) {
  const branches = new Map();
  for (const source of details) {
    for (const flow of source.branchFlows || []) {
      let combined = branches.get(flow.id);
      if (!combined) {
        combined = {
          id: flow.id, name: flow.name, kind: flow.kind,
          from: flow.from, to: flow.to,
          fromPhasor: {r: 0, i: 0}, toPhasor: {r: 0, i: 0},
          fromBoundA: 0, toBoundA: 0
        };
        branches.set(flow.id, combined);
      }
      if (source.current && source.unknownAngle) {
        combined.fromBoundA += flow.amps;
        combined.toBoundA += flow.toAmps;
      } else {
        combined.fromPhasor.r += flow.fromPhasor.r;
        combined.fromPhasor.i += flow.fromPhasor.i;
        combined.toPhasor.r += flow.toPhasor.r;
        combined.toPhasor.i += flow.toPhasor.i;
      }
    }
  }
  return [...branches.values()].map(flow => ({
    ...flow,
    fromA: Math.hypot(flow.fromPhasor.r, flow.fromPhasor.i) + flow.fromBoundA,
    toA: Math.hypot(flow.toPhasor.r, flow.toPhasor.i) + flow.toBoundA,
    bound: flow.fromBoundA > 0 || flow.toBoundA > 0
  }));
}
