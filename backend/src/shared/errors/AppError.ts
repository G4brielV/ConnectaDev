export class AppError {
  public readonly message: string;
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, statusCode = 400, details?: any) {
    this.message = message;
    this.statusCode = statusCode;
    this.details = details;
  }
}
