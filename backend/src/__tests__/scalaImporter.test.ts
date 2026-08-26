import { buildDiagramFromScala } from '../importer/diagramBuilder';
import { parseScalaSource } from '../importer/scalaParser';
import { parseDiagram } from '../generator/parser';
import { generateScalaCode } from '../generator/generator';
import { diagramPayloadSchema } from '../schemas/diagramSchemas';

const cuentas = `
package clase05
import scala.collection.mutable.ListBuffer

/** Queremos modelar cuentas de ahorro y cuentas corrientes. La clase
  * AbstractCuenta no deberia aparecer como texto en el diagrama.
  */

abstract class AbstractCuenta(val nombre: String, saldoInicial: Int) {
  private var saldo = saldoInicial
  def getSaldo: Int = saldo
  def setSaldo(newSaldo: Int) = saldo = newSaldo
  def depositar(monto: Int) = saldo += monto

  def girar(monto: Int): Boolean = {
    if (puedeGirar(monto)) {
      setSaldo(getSaldo - monto)
      true
    } else false
  }
  def puedeGirar(monto: Int): Boolean
}

class CuentaAhorro(nombre: String, saldoInicial: Int)
    extends AbstractCuenta(nombre, saldoInicial) {
  // private val movimientos: ListBuffer[String] = ListBuffer()
  def puedeGirar(monto: Int): Boolean = monto <= getSaldo
}

class CuentaCorriente(nombre: String, saldoInicial: Int, linea: Int)
    extends AbstractCuenta(nombre, saldoInicial) {

  def puedeGirar(monto: Int) = monto <= getSaldo + linea

}
`;

const findNode = (diagram: ReturnType<typeof buildDiagramFromScala>, name: string) => {
  const node = diagram.nodes.find((n) => n.name === name);
  if (!node) throw new Error(`No se encontró el nodo ${name}`);
  return node;
};

describe('parseScalaSource', () => {
  it('distinguishes traits, abstract classes and concrete classes', () => {
    const decls = parseScalaSource(`
      trait Volador { def volar(): Unit }
      abstract class Ave { def comer(): Unit = () }
      class Pinguino extends Ave
    `);

    expect(decls.map((d) => [d.name, d.kind])).toEqual([
      ['Volador', 'trait'],
      ['Ave', 'abstractClass'],
      ['Pinguino', 'class'],
    ]);
  });

  it('marks a method as abstract only when it has no body', () => {
    const [decl] = parseScalaSource(`
      abstract class A {
        def sinCuerpo(x: Int): Boolean
        def conCuerpo(x: Int): Boolean = x > 0
        def conBloque(x: Int): Boolean = {
          x > 0
        }
      }
    `);

    expect(decl.methods.map((m) => [m.name, m.isAbstract])).toEqual([
      ['sinCuerpo', true],
      ['conCuerpo', false],
      ['conBloque', false],
    ]);
  });

  it('ignores declarations written inside method bodies, comments and strings', () => {
    const [decl] = parseScalaSource(`
      class A {
        def run(): Unit = {
          class Interna(x: Int)
          val oculto: Int = 1
        }
        // def comentado(): Unit
        val texto: String = "class Falsa { def falso(): Unit }"
      }
    `);

    expect(decl.methods.map((m) => m.name)).toEqual(['run']);
    expect(decl.fields.map((f) => f.name)).toEqual(['texto']);
  });

  it('reads constructor params as fields and keeps their visibility', () => {
    const [decl] = parseScalaSource(
      'class Persona(val nombre: String, private val rut: String, edad: Int)'
    );

    expect(decl.fields).toEqual([
      { name: 'nombre', type: 'String', visibility: 'public', fromConstructor: true },
      { name: 'rut', type: 'String', visibility: 'private', fromConstructor: true },
      { name: 'edad', type: 'Int', visibility: 'public', fromConstructor: true },
    ]);
  });

  it('collects every parameter list and skips implicit ones', () => {
    const [decl] = parseScalaSource(`
      class A {
        def combinar(x: Int, y: String)(z: Boolean)(implicit ord: Ordering[Int]): Long = 0L
      }
    `);

    expect(decl.methods[0]).toMatchObject({
      name: 'combinar',
      params: ['Int', 'String', 'Boolean'],
      returnType: 'Long',
    });
  });

  it('ignores objects, auxiliary constructors and imports', () => {
    const decls = parseScalaSource(`
      import scala.collection.mutable.ListBuffer
      object Main {
        def main(args: Array[String]): Unit = println("hola")
      }
      class A(x: Int) {
        def this() = this(0)
      }
    `);

    expect(decls.map((d) => d.name)).toEqual(['A']);
    expect(decls[0].methods).toHaveLength(0);
  });

  it('infers the type of a val without annotation', () => {
    const [decl] = parseScalaSource(`
      class A(inicial: Int) {
        private var saldo = inicial
        val activo = true
        val nombre = "sin nombre"
        val lista = ListBuffer[String]()
      }
    `);

    expect(decl.fields.map((f) => [f.name, f.type])).toEqual([
      ['inicial', 'Int'],
      ['saldo', 'Int'],
      ['activo', 'Boolean'],
      ['nombre', 'String'],
      ['lista', 'ListBuffer[String]'],
    ]);
  });
});

describe('buildDiagramFromScala', () => {
  it('produces a payload valid against the diagram schema', () => {
    const diagram = buildDiagramFromScala(cuentas);
    expect(diagramPayloadSchema.safeParse(diagram).success).toBe(true);
  });

  it('maps the accounts example to three nodes and two inheritance edges', () => {
    const diagram = buildDiagramFromScala(cuentas);

    expect(diagram.nodes.map((n) => [n.name, n.classType])).toEqual([
      ['AbstractCuenta', 'abstractClass'],
      ['CuentaAhorro', 'concreteClass'],
      ['CuentaCorriente', 'concreteClass'],
    ]);

    expect(diagram.edges).toHaveLength(2);
    diagram.edges.forEach((edge) => {
      expect(edge.type).toBe('inheritance');
      expect(edge.target).toBe(findNode(diagram, 'AbstractCuenta').id);
    });
  });

  it('keeps the abstract method in italics-worthy state and the concrete ones not', () => {
    const abstracta = findNode(buildDiagramFromScala(cuentas), 'AbstractCuenta');
    const puedeGirar = abstracta.methods.find((m) => m.name === 'puedeGirar');

    expect(puedeGirar?.abstract).toBe(true);
    expect(abstracta.methods.filter((m) => m.abstract)).toHaveLength(1);
  });

  it('inherits the return type when the child method omits it', () => {
    const corriente = findNode(buildDiagramFromScala(cuentas), 'CuentaCorriente');
    expect(corriente.methods[0]).toMatchObject({ name: 'puedeGirar', codType: 'Boolean' });
  });

  it('creates an implementation edge when the parent is a trait', () => {
    const diagram = buildDiagramFromScala(`
      trait Volador { def volar(): Unit }
      abstract class Ave
      class Pato extends Ave with Volador
    `);

    const pato = findNode(diagram, 'Pato');
    const types = diagram.edges
      .filter((e) => e.source === pato.id)
      .map((e) => e.type)
      .sort();

    expect(types).toEqual(['implementation', 'inheritance']);
  });

  it('creates association and aggregation edges from field types', () => {
    const diagram = buildDiagramFromScala(`
      class Motor
      class Rueda
      class Auto(val motor: Motor, val ruedas: List[Rueda])
    `);

    const auto = findNode(diagram, 'Auto');
    const byTarget = new Map(diagram.edges.map((e) => [e.target, e.type]));

    expect(diagram.edges.every((e) => e.source === auto.id)).toBe(true);
    expect(byTarget.get(findNode(diagram, 'Motor').id)).toBe('association');
    expect(byTarget.get(findNode(diagram, 'Rueda').id)).toBe('aggregation');
  });

  it('ignores parents that are not part of the pasted code', () => {
    const diagram = buildDiagramFromScala('class MiError(msg: String) extends Exception(msg)');
    expect(diagram.nodes).toHaveLength(1);
    expect(diagram.edges).toHaveLength(0);
  });

  it('uses handle ids that match the relation type expected by the editor', () => {
    const diagram = buildDiagramFromScala(cuentas);
    diagram.edges.forEach((edge) => {
      expect(edge.sourceHandle).toBe('top-handle-2');
      expect(edge.targetHandle).toBe('bottom-handle-2');
    });
  });

  it('returns an empty diagram when there is nothing to import', () => {
    expect(buildDiagramFromScala('object Main { def main(): Unit = () }').nodes).toHaveLength(0);
  });
});

describe('import then export', () => {
  it('regenerates the accounts hierarchy', () => {
    const diagram = buildDiagramFromScala(cuentas);
    const code = generateScalaCode(parseDiagram(diagram));

    expect(code).toContain('abstract class AbstractCuenta(');
    expect(code).toContain('class CuentaAhorro(');
    expect(code).toContain('extends AbstractCuenta');
    // El método abstracto se mantiene sin implementación.
    expect(code).toContain('def puedeGirar(param1: Int): Boolean\n');
  });
});
