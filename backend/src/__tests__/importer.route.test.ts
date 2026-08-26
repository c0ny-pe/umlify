import request from 'supertest';
import app from '../app';

const scalaCode = `
abstract class AbstractCuenta(val nombre: String, saldoInicial: Int) {
  def puedeGirar(monto: Int): Boolean
}

class CuentaAhorro(nombre: String, saldoInicial: Int)
    extends AbstractCuenta(nombre, saldoInicial) {
  def puedeGirar(monto: Int): Boolean = monto <= saldoInicial
}
`;

describe('POST /api/importer', () => {
  it('returns 400 when the body has no code', async () => {
    const res = await request(app).post('/api/importer').send({ unexpected: true });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the code is blank', async () => {
    const res = await request(app).post('/api/importer').send({ code: '   \n  ' });
    expect(res.status).toBe(400);
  });

  it('returns 422 when there are no classes to import', async () => {
    const res = await request(app)
      .post('/api/importer')
      .send({ code: 'object Main { def main(): Unit = () }' });
    expect(res.status).toBe(422);
  });

  it('returns the diagram payload for valid Scala code', async () => {
    const res = await request(app).post('/api/importer').send({ code: scalaCode });

    expect(res.status).toBe(200);
    expect(res.body.nodes).toHaveLength(2);
    expect(res.body.edges).toHaveLength(1);
    expect(res.body.edges[0].type).toBe('inheritance');
  });
});
