"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CorruptedError extends Error {
    CorruptedError(message = "") {
        this.name = "CorruptedError";
        this.message = message;
    }
}
exports.CorruptedError = CorruptedError;
class TruncatedError extends Error {
    TruncatedError(message = "") {
        this.name = "TruncatedError";
        this.message = message;
    }
}
exports.TruncatedError = TruncatedError;
//# sourceMappingURL=errors.js.map