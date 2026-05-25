import pool from '../db';
import type { DiagramPayload } from '../schemas/diagramSchemas';
import { randomUUID } from 'crypto';

export interface Method {
  name: string;
  domType: string[];
  codType: string;
  visibility: 'public' | 'protected' | 'private';
  abstract: boolean;
}

export interface Field {
  name: string;
  type: string;
  visibility: 'public' | 'protected' | 'private';
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
  sourceHandle: string;
  targetHandle: string;
  type: 'aggregation' | 'association' | 'composition' | 'dependency' | 'implementation' | 'inheritance';
}

export interface DiagramContent {
  nodes: DiagramPayload['nodes'];
  edges: DiagramPayload['edges'];
}

export interface Diagram {
  id: string;
  user_id: number;
  name: string;
  content: DiagramContent;
  created_at: string;
  updated_at: string;
}

export async function createDiagram(user_id: number, name: string, content: DiagramContent): Promise<Diagram> {
  const id = randomUUID();
  const result = await pool.query(
    'INSERT INTO diagrams (id, user_id, name, content) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, user_id, name, content]
  );
  return result.rows[0];
}

export async function getDiagramsByUserId(user_id: number): Promise<Diagram[]> {
  const result = await pool.query(
    'SELECT * FROM diagrams WHERE user_id = $1 ORDER BY updated_at DESC, created_at DESC',
    [user_id]
  );
  return result.rows;
}

export async function getDiagramById(id: string): Promise<Diagram | null> {
  const result = await pool.query('SELECT * FROM diagrams WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function updateDiagram(id: string, name: string, content: DiagramContent): Promise<Diagram> {
  const result = await pool.query(
    'UPDATE diagrams SET name = $1, content = $2, updated_at = current_timestamp WHERE id = $3 RETURNING *',
    [name, content, id]
  );
  return result.rows[0];
}

export async function deleteDiagram(id: string): Promise<void> {
  await pool.query('DELETE FROM diagrams WHERE id = $1', [id]);
}
