// Goal: Generic file for exception classes
//

export class CorruptedError extends Error {
  public CorruptedError(message: string = ""): void {
    this.name = "CorruptedError";
    this.message = message;
  }
}

export class TruncatedError extends Error {
  public TruncatedError(message: string = ""): void {
    this.name = "TruncatedError";
    this.message = message;
  }
}
