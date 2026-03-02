exports.up = (pgm) => {
    // Tabla de usuarios
    pgm.createTable('users', {
        id: 'id',
        username: { type: 'varchar(50)', notNull: true, unique: true },
        password: { type: 'varchar(255)', notNull: true },
        created_at: {
            type: 'timestamp',
            notNull: true,
            default: pgm.func('current_timestamp'),
        },
    });

    // Tabla de diagramas
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

exports.down = (pgm) => {
    pgm.dropTable('diagrams');
    pgm.dropTable('users');
};
