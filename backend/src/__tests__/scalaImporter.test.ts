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

  it('only treats constructor params with val or var as state', () => {
    const [decl] = parseScalaSource(
      'class Persona(val nombre: String, private val rut: String, edad: Int)'
    );

    // edad no lleva val ni var: firma el constructor, pero no es un atributo.
    expect(decl.fields).toEqual([
      { name: 'nombre', type: 'String', visibility: 'public', fromConstructor: true },
      { name: 'rut', type: 'String', visibility: 'private', fromConstructor: true },
    ]);

    expect(decl.constructors).toHaveLength(1);
    expect(decl.constructors[0]).toMatchObject({ isPrimary: true });
    expect(decl.constructors[0].params.map((p) => p.type)).toEqual(['String', 'String', 'Int']);
  });

  it('treats every case class param as state', () => {
    const [decl] = parseScalaSource('case class Punto(x: Int, y: Int)');
    expect(decl.fields.map((f) => f.name)).toEqual(['x', 'y']);
  });

  it('reads auxiliary constructors', () => {
    const [decl] = parseScalaSource(`
      class CuentaAhorro(nombre: String, saldoInicial: Int) {
        def this(nombre: String) = this(nombre, 0)
      }
    `);

    expect(decl.fields).toHaveLength(0);
    expect(decl.constructors.map((c) => c.params.map((p) => p.type))).toEqual([
      ['String', 'Int'],
      ['String'],
    ]);
    expect(decl.constructors.map((c) => c.isPrimary)).toEqual([true, false]);
  });

  it('gives no constructor to a trait or to a class without a param list', () => {
    const decls = parseScalaSource(`
      trait Volador { def volar(): Unit }
      class Simple { val x: Int = 1 }
    `);

    expect(decls.map((d) => d.constructors.length)).toEqual([0, 0]);
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

    // inicial no es estado, pero sigue visible para inferir el tipo de saldo.
    expect(decl.fields.map((f) => [f.name, f.type])).toEqual([
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
    const puedeGirar = corriente.methods.find((m) => m.name === 'puedeGirar');

    expect(puedeGirar).toMatchObject({ codType: 'Boolean' });
  });

  it('shows each constructor as an operation named after the class', () => {
    const diagram = buildDiagramFromScala(`
      class CuentaAhorro(nombre: String, saldoInicial: Int) {
        def this(nombre: String) = this(nombre, 0)
        def puedeGirar(monto: Int): Boolean = true
      }
    `);

    const cuenta = findNode(diagram, 'CuentaAhorro');

    // nombre y saldoInicial no llevan val: firman el constructor, no el estado.
    expect(cuenta.fields).toHaveLength(0);
    expect(cuenta.methods.map((m) => [m.name, m.domType])).toEqual([
      ['CuentaAhorro', ['String', 'Int']],
      ['CuentaAhorro', ['String']],
      ['puedeGirar', ['Int']],
    ]);
  });

  it('keeps as attributes only the constructor params with val or var', () => {
    const abstracta = findNode(buildDiagramFromScala(cuentas), 'AbstractCuenta');

    expect(abstracta.fields.map((f) => f.name)).toEqual(['nombre', 'saldo']);
    expect(abstracta.methods[0]).toMatchObject({
      name: 'AbstractCuenta',
      domType: ['String', 'Int'],
      abstract: false,
    });
  });

  it('creates an inheritance edge between two traits', () => {
    const diagram = buildDiagramFromScala(`
      trait Volador { def volar(): Unit }
      trait Planeador extends Volador
    `);

    expect(diagram.edges.map((e) => e.type)).toEqual(['inheritance']);
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
  it('regenerates an auxiliary constructor as def this', () => {
    const diagram = buildDiagramFromScala(`
      class CuentaAhorro(nombre: String, saldoInicial: Int) {
        def this(nombre: String) = this(nombre, 0)
      }
    `);
    const code = generateScalaCode(parseDiagram(diagram));

    expect(code).toContain('class CuentaAhorro(param1: String, param2: Int)');
    expect(code).toContain('def this(param1: String) = this(???, ???)');
  });

  it('regenerates the accounts hierarchy', () => {
    const diagram = buildDiagramFromScala(cuentas);
    const code = generateScalaCode(parseDiagram(diagram));

    // La cabecera vuelve a tener la firma del constructor importado.
    expect(code).toContain('abstract class AbstractCuenta(param1: String, param2: Int)');
    expect(code).toContain('class CuentaAhorro(param1: String, param2: Int)');
    expect(code).toContain('extends AbstractCuenta');
    // El estado se mantiene como atributo y el constructor no se duplica.
    expect(code).toContain('val nombre: String');
    expect(code).not.toContain('def AbstractCuenta');
    // El método abstracto se mantiene sin implementación.
    expect(code).toContain('def puedeGirar(param1: Int): Boolean\n');
  });
});
