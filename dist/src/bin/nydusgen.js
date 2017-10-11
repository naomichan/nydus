"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const bluebird_1 = require("bluebird");
const fs_1 = require("fs");
const path_1 = require("path");
const heroprotoc_1 = require("../tool/heroprotoc");
const statAsync = bluebird_1.promisify(fs_1.stat);
const readFileAsync = bluebird_1.promisify(fs_1.readFile);
const readdirAsync = bluebird_1.promisify(fs_1.readdir);
const writeFileAsync = bluebird_1.promisify(fs_1.writeFile);
function find(dir, out) {
    return __awaiter(this, void 0, void 0, function* () {
        const files = yield readdirAsync(dir);
        for (const filename of files) {
            const file = path_1.basename(filename);
            if (path_1.extname(file) === ".py" && file.startsWith("protocol") && (yield statAsync(path_1.resolve(dir, file))).isFile()) {
                const version = parseInt(file.substr(8).split(".").shift(), 10);
                yield writeFileAsync(path_1.resolve(out, `protocol${version}.js`), heroprotoc_1.Generate((yield readFileAsync(path_1.resolve(dir, file))).toString(), version));
                console.log(`Saved ${path_1.resolve(out, `protocol${version}.js`)}`);
            }
        }
    });
}
function _() {
    return __awaiter(this, void 0, void 0, function* () {
        const fd = process.argv.pop();
        if ((yield statAsync(fd)).isDirectory()) {
            yield find(fd, process.argv.pop());
            return;
        }
        console.log(heroprotoc_1.Generate((yield readFileAsync(fd)).toString(), parseInt(process.argv.pop(), 10)));
    });
}
_().catch((x) => { throw x; });
//# sourceMappingURL=nydusgen.js.map