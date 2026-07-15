import request from 'supertest';
import app from '../app';

const minimalPayload = {
  nodes: [
    {
      id: '1',
      name: 'Foo',
      classType: 'concreteClass',
      fields: [],
      methods: [],
      x: 0,
      y: 0,
    },
  ],
  edges: [],
};

const payloadWithEdge = {
  nodes: [
    { id: '1', name: 'Animal', classType: 'concreteClass', fields: [], methods: [], x: 0, y: 0 },
    { id: '2', name: 'Dog', classType: 'concreteClass', fields: [], methods: [], x: 0, y: 0 },
  ],
  edges: [
    {
      source: '2',
      target: '1',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'inheritance',
    },
  ],
};

describe('POST /api/generator', () => {
  it('returns 400 when body is missing required fields', async () => {
    const res = await request(app)
      .post('/api/generator')
      .send({ unexpected: true });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when node has invalid classType', async () => {
    const invalid = {
      nodes: [{ id: '1', name: 'Foo', classType: 'invalidType', fields: [], methods: [], x: 0, y: 0 }],
      edges: [],
    };
    const res = await request(app)
      .post('/api/generator')
      .send(invalid);
    expect(res.status).toBe(400);
  });

  it('returns 200 with Scala text for a valid single-node payload', async () => {
    const res = await request(app)
      .post('/api/generator')
      .send(minimalPayload);
    expect(res.status).toBe(200);
    expect(res.text).toContain('class Foo');
  });

  it('returns 200 with inheritance clause for related nodes', async () => {
    const res = await request(app)
      .post('/api/generator')
      .send(payloadWithEdge);
    expect(res.status).toBe(200);
    expect(res.text).toContain('class Dog extends Animal');
  });

  it('returns Content-Type text/plain', async () => {
    const res = await request(app)
      .post('/api/generator')
      .send(minimalPayload);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });

  it('returns Content-Disposition attachment header', async () => {
    const res = await request(app)
      .post('/api/generator')
      .send(minimalPayload);
    expect(res.headers['content-disposition']).toMatch(/attachment/);
    expect(res.headers['content-disposition']).toMatch(/diagram\.scala/);
  });
});
