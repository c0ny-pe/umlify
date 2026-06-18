import { generateScalaCode } from '../generator/generator';
import { DiagramModel, Class, Relation } from '../types/generator';

const cls = (overrides: Partial<Class> & { id: string; name: string }): Class => ({
  classType: 'concreteClass',
  fields: [],
  methods: [],
  ...overrides,
});

const field = (name: string, type: string, visibility: 'public' | 'private' | 'protected' = 'public') => ({
  name,
  type,
  visibility,
});

const method = (
  name: string,
  domType: string[] = [],
  codType: string | null = null,
  visibility: 'public' | 'private' | 'protected' = 'public',
) => ({
  name,
  domType,
  codType,
  visibility,
  abstract: false,
});

const rel = (source: string, target: string, type: Relation['type']): Relation => ({
  source,
  target,
  type,
});

const model = (classes: Class[], relations: Relation[] = []): DiagramModel => ({
  classes,
  relations,
});

describe('generateScalaCode', () => {
  describe('empty and trivial cases', () => {
    it('returns empty string for empty diagram', () => {
      expect(generateScalaCode(model([]))).toBe('');
    });

    it('generates empty concrete class', () => {
      const code = generateScalaCode(model([cls({ id: '1', name: 'Foo' })]));
      expect(code).toBe('class Foo {}');
    });

    it('generates empty abstract class', () => {
      const code = generateScalaCode(model([cls({ id: '1', name: 'Shape', classType: 'abstractClass' })]));
      expect(code).toBe('abstract class Shape {}');
    });

    it('generates empty trait', () => {
      const code = generateScalaCode(model([cls({ id: '1', name: 'Flyable', classType: 'trait' })]));
      expect(code).toBe('trait Flyable {}');
    });
  });

  describe('class fields', () => {
    it('puts public fields as constructor parameters', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Point', fields: [field('x', 'Int'), field('y', 'Int')] }),
      ]));
      expect(code).toContain('class Point(val x: Int, val y: Int)');
    });

    it('prepends visibility for non-public fields', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Account', fields: [field('balance', 'Double', 'private')] }),
      ]));
      expect(code).toContain('class Account(private val balance: Double)');
    });
  });

  describe('class methods', () => {
    it('appends = ??? to concrete class method bodies', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Greeter', methods: [method('greet', [], 'String')] }),
      ]));
      expect(code).toContain('def greet(): String = ???');
    });

    it('does NOT append = ??? to abstract methods in abstract class', () => {
      const abstractMethod = { ...method('area', [], 'Double'), abstract: true };
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Shape', classType: 'abstractClass', methods: [abstractMethod] }),
      ]));
      expect(code).toContain('def area(): Double');
      expect(code).not.toContain('def area(): Double = ???');
    });

    it('appends = ??? to concrete methods in abstract class', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Shape', classType: 'abstractClass', methods: [method('describe', [], 'String')] }),
      ]));
      expect(code).toContain('def describe(): String = ???');
    });

    it('defaults return type to Unit when codType is null', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Logger', methods: [method('log')] }),
      ]));
      expect(code).toContain('def log(): Unit = ???');
    });

    it('formats multiple method parameters', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Math', methods: [method('add', ['Int', 'Int'], 'Int')] }),
      ]));
      expect(code).toContain('def add(param1: Int, param2: Int): Int = ???');
    });

    it('prepends visibility for protected method', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Base', methods: [method('init', [], 'Unit', 'protected')] }),
      ]));
      expect(code).toContain('protected def init(): Unit = ???');
    });
  });

  describe('trait body', () => {
    it('puts trait fields in body (not constructor)', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Named', classType: 'trait', fields: [field('name', 'String')] }),
      ]));
      expect(code).toContain('trait Named {');
      expect(code).toContain('val name: String');
      expect(code).not.toContain('trait Named(');
    });

    it('generates abstract trait method as signature only', () => {
      const abstractMethod = { ...method('fly', [], 'Unit'), abstract: true };
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Flyable', classType: 'trait', methods: [abstractMethod] }),
      ]));
      expect(code).toContain('def fly(): Unit');
      expect(code).not.toContain('def fly(): Unit = ???');
    });

    it('generates concrete trait method with = ???', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'Flyable', classType: 'trait', methods: [method('fly', [], 'Unit')] }),
      ]));
      expect(code).toContain('def fly(): Unit = ???');
    });
  });

  describe('inheritance and implementation', () => {
    it('generates extends clause for inheritance', () => {
      const code = generateScalaCode(model(
        [cls({ id: '1', name: 'Animal' }), cls({ id: '2', name: 'Dog' })],
        [rel('2', '1', 'inheritance')],
      ));
      expect(code).toContain('class Dog extends Animal');
    });

    it('generates extends clause when class implements another class', () => {
      const code = generateScalaCode(model(
        [cls({ id: '1', name: 'Base' }), cls({ id: '2', name: 'Child' })],
        [rel('2', '1', 'implementation')],
      ));
      expect(code).toContain('class Child extends Base');
    });

    it('uses extends when class implements a single trait', () => {
      const code = generateScalaCode(model(
        [cls({ id: '1', name: 'Flyable', classType: 'trait' }), cls({ id: '2', name: 'Bird' })],
        [rel('2', '1', 'implementation')],
      ));
      expect(code).toContain('class Bird extends Flyable');
    });

    it('uses with for second and subsequent traits', () => {
      const code = generateScalaCode(model(
        [
          cls({ id: '1', name: 'Base' }),
          cls({ id: '2', name: 'Flyable', classType: 'trait' }),
          cls({ id: '3', name: 'Swimmable', classType: 'trait' }),
          cls({ id: '4', name: 'Duck' }),
        ],
        [
          rel('4', '1', 'inheritance'),
          rel('4', '2', 'implementation'),
          rel('4', '3', 'implementation'),
        ],
      ));
      expect(code).toContain('class Duck extends Base with Flyable with Swimmable');
    });
  });

  describe('associations and aggregations', () => {
    it('generates association field when not defined manually', () => {
      const code = generateScalaCode(model(
        [cls({ id: '1', name: 'Engine' }), cls({ id: '2', name: 'Car' })],
        [rel('2', '1', 'association')],
      ));
      expect(code).toContain('val engine: Engine = ???');
    });

    it('generates aggregation field when not defined manually', () => {
      const code = generateScalaCode(model(
        [cls({ id: '1', name: 'Wheel' }), cls({ id: '2', name: 'Car' })],
        [rel('2', '1', 'aggregation')],
      ));
      expect(code).toContain('val wheelList: List[Wheel] = List.empty');
    });

    it('treats composition same as aggregation', () => {
      const code = generateScalaCode(model(
        [cls({ id: '1', name: 'Engine' }), cls({ id: '2', name: 'Car' })],
        [rel('2', '1', 'composition')],
      ));
      expect(code).toContain('val engineList: List[Engine] = List.empty');
    });

    it('treats dependency same as association', () => {
      const code = generateScalaCode(model(
        [cls({ id: '1', name: 'Logger' }), cls({ id: '2', name: 'Service' })],
        [rel('2', '1', 'dependency')],
      ));
      expect(code).toContain('val logger: Logger = ???');
    });

    it('does not duplicate association field already defined in class', () => {
      const code = generateScalaCode(model(
        [
          cls({ id: '1', name: 'Engine' }),
          cls({ id: '2', name: 'Car', fields: [field('engine', 'Engine')] }),
        ],
        [rel('2', '1', 'association')],
      ));
      const matches = (code.match(/val engine/g) || []).length;
      expect(matches).toBe(1);
    });

    it('does not duplicate aggregation field already defined in class', () => {
      const code = generateScalaCode(model(
        [
          cls({ id: '1', name: 'Wheel' }),
          cls({ id: '2', name: 'Car', fields: [field('wheels', 'List[Wheel]')] }),
        ],
        [rel('2', '1', 'aggregation')],
      ));
      const matches = (code.match(/List\[Wheel\]/g) || []).length;
      expect(matches).toBe(1);
    });
  });

  describe('multiple classes', () => {
    it('separates multiple classes with double newline', () => {
      const code = generateScalaCode(model([
        cls({ id: '1', name: 'A' }),
        cls({ id: '2', name: 'B' }),
      ]));
      expect(code).toBe('class A {}\n\nclass B {}');
    });
  });
});
