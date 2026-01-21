/**
 * Exception thrown when the program detects a node with invalid handles.
 * A node can only have source handles (and in all directions) to simplify the connection logic.
 * 
 * @see StyledNode for further information.
 * @extends {Error}
 * 
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>.
 */
class InvalidHandleException extends Error {
  constructor() {
    super("Nodes must only have source handles, and in all directions (left, right, top, bottom)");
    this.name = 'InvalidHandleException';
  }
}