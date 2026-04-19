exports.up = (pgm) => {
  // Crear extensión UUID si no existe
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  // Borrar tabla diagrams (y sus restricciones)
  pgm.dropTable('diagrams', { ifExists: true });

  // Recrear tabla diagrams con id como UUID
  pgm.createTable('diagrams', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
      notNull: true,
    },
    name: { type: 'varchar(255)', notNull: true },
    content: { type: 'jsonb', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('diagrams', 'user_id');
};

exports.down = (pgm) => {
  // Revertir a la estructura anterior
  pgm.dropTable('diagrams');
  pgm.createTable('diagrams', {
    id: 'id',
    user_id: {
      type: 'integer',
      references: '"users"',
      onDelete: 'CASCADE',
      notNull: true,
    },
    name: { type: 'varchar(255)', notNull: true },
    content: { type: 'jsonb', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
  pgm.createIndex('diagrams', 'user_id');
};
