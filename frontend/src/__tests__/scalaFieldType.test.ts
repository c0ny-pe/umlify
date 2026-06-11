import { SCALA_SIMPLE_TYPE_LIST } from '../utils/scalaFieldType';

describe('SCALA_SIMPLE_TYPE_LIST', () => {
  it('contains primitive numeric types', () => {
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Int');
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Double');
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Float');
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Long');
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Short');
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Byte');
  });

  it('contains String and Char types', () => {
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('String');
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Char');
  });

  it('contains Boolean type', () => {
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Boolean');
  });

  it('contains Unit as valid return type', () => {
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Unit');
  });

  it('contains Any as the top type', () => {
    expect(SCALA_SIMPLE_TYPE_LIST).toContain('Any');
  });

  it('has no duplicate entries', () => {
    const unique = new Set(SCALA_SIMPLE_TYPE_LIST);
    expect(unique.size).toBe(SCALA_SIMPLE_TYPE_LIST.length);
  });

  it('contains only non-empty strings', () => {
    SCALA_SIMPLE_TYPE_LIST.forEach((t) => {
      expect(typeof t).toBe('string');
      expect(t.length).toBeGreaterThan(0);
    });
  });

  it('is a non-empty array', () => {
    expect(Array.isArray(SCALA_SIMPLE_TYPE_LIST)).toBe(true);
    expect(SCALA_SIMPLE_TYPE_LIST.length).toBeGreaterThan(0);
  });
});
