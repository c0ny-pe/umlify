/**
 * Exception thrown when the user makes an invalid connection between nodes in the canvas.
 * 
 * @extends {Error}
 * 
 * @author Máximo Flores Valenzuela <https://github.com/maxfloresv>.
 */
export default class InvalidConnectionException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidHandleException';
  }
}