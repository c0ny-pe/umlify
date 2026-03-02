import pool from '../db';

export interface Method {
  name: string;
  returnType: string;
  visibility?: 'public' | 'protected' | 'private';
}

export interface Field {
  name: string;
  fieldType: string;
  visibility?: 'public' | 'protected' | 'private';
}

export interface Node {
  id: string;
  name: string;
  classType: 'trait' | 'concreteClass' | 'abstractClass' | string;
  methods: Method[];
  fields: Field[];
  x: number;
  y: number;
}

export interface Edge {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type: 'association' | 'implementation' | 'generalization' | 'dependency' | string;
}

export interface DiagramContent {
  nodes: Node[];
  edges: Edge[];
}

export interface Diagram {
  id: number;
  user_id: number;
  name: string;
  content: DiagramContent;
  created_at: string;
  updated_at: string;
}

export async function createDiagram(user_id: number, name: string, content: DiagramContent): Promise<Diagram> {
  const result = await pool.query(
    'INSERT INTO diagrams (user_id, name, content) VALUES ($1, $2, $3) RETURNING *',
    [user_id, name, content]
  );
  return result.rows[0];
}

export async function getDiagramsByUserId(user_id: number): Promise<Diagram[]> {
  const result = await pool.query('SELECT * FROM diagrams WHERE user_id = $1', [user_id]);
  return result.rows;
}
