import { parseDiagram } from '../generator/parser';
import { JSONDiagram } from '../types/generator';

const makeNode = (overrides = {}) => ({
  id: '1',
  name: 'Foo',
  classType: 'concreteClass' as const,
  fields: [] as { name: string; type: string; visibility: 'public' | 'protected' | 'private' | null }[],
  methods: [] as { name: string; domType: string[]; codType: string | null; visibility: 'public' | 'protected' | 'private' | null; abstract: boolean }[],
  x: 10,
  y: 20,
  ...overrides,
});

const makeEdge = (overrides = {}) => ({
  source: '1',
  target: '2',
  sourceHandle: 'right',
  targetHandle: 'left',
  type: 'inheritance' as const,
  ...overrides,
});

describe('parseDiagram', () => {
  it('returns empty classes and relations for an empty diagram', () => {
    const result = parseDiagram({ nodes: [], edges: [] });
    expect(result.classes).toHaveLength(0);
    expect(result.relations).toHaveLength(0);
  });

  it('maps id, name, classType, fields and methods from node', () => {
    const node = makeNode({
      fields: [{ name: 'x', type: 'Int', visibility: 'public' as const }],
      methods: [{ name: 'run', domType: ['String'], codType: 'Unit', visibility: 'public' as const, abstract: false }],
    });
    const result = parseDiagram({ nodes: [node], edges: [] });
    const cls = result.classes[0];

    expect(cls.id).toBe('1');
    expect(cls.name).toBe('Foo');
    expect(cls.classType).toBe('concreteClass');
    expect(cls.fields).toEqual(node.fields);
    expect(cls.methods).toEqual(node.methods);
  });

  it('strips x and y coordinates from parsed class', () => {
    const result = parseDiagram({ nodes: [makeNode()], edges: [] });
    expect(result.classes[0]).not.toHaveProperty('x');
    expect(result.classes[0]).not.toHaveProperty('y');
  });

  it('maps source, target and type from edge', () => {
    const result = parseDiagram({ nodes: [], edges: [makeEdge()] });
    const rel = result.relations[0];

    expect(rel.source).toBe('1');
    expect(rel.target).toBe('2');
    expect(rel.type).toBe('inheritance');
  });

  it('strips sourceHandle and targetHandle from parsed relation', () => {
    const result = parseDiagram({ nodes: [], edges: [makeEdge()] });
    expect(result.relations[0]).not.toHaveProperty('sourceHandle');
    expect(result.relations[0]).not.toHaveProperty('targetHandle');
  });

  it('preserves order and count of multiple nodes and edges', () => {
    const nodes = [makeNode({ id: '1', name: 'A' }), makeNode({ id: '2', name: 'B' })];
    const edges = [makeEdge({ source: '2', target: '1', type: 'association' as const })];
    const result = parseDiagram({ nodes, edges } as JSONDiagram);

    expect(result.classes).toHaveLength(2);
    expect(result.classes[0].name).toBe('A');
    expect(result.classes[1].name).toBe('B');
    expect(result.relations).toHaveLength(1);
    expect(result.relations[0].type).toBe('association');
  });

  it('handles all relation types', () => {
    const types = ['aggregation', 'association', 'composition', 'dependency', 'implementation', 'inheritance'] as const;
    types.forEach((type) => {
      const result = parseDiagram({ nodes: [], edges: [makeEdge({ type })] });
      expect(result.relations[0].type).toBe(type);
    });
  });
});
