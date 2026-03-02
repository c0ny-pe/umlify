exports.up = (pgm) => {
    pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = current_timestamp;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trigger_diagrams_updated
    BEFORE UPDATE ON diagrams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
  `);
};

exports.down = (pgm) => {
    pgm.sql(`
    DROP TRIGGER IF EXISTS trigger_diagrams_updated ON diagrams;
    DROP FUNCTION IF EXISTS update_updated_at;
  `);
};
