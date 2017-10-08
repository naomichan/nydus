// Goal: Library file to scan a folder to translate all protocol[0-9].py files
//

import { promisify } from "bluebird";
import { readdir, readFile, stat, writeFile } from "fs";
import { basename, extname, resolve } from "path";
import { Generate } from "../tool/heroprotoc";

const statAsync = promisify(stat);
const readFileAsync = promisify(readFile);
const readdirAsync = promisify(readdir);
const writeFileAsync = promisify(writeFile);

async function find(dir: string, out: string): Promise<void> {
  const files: string[] = await readdirAsync(dir);
  for(const filename of files) {
    const file = basename(filename);
    if(extname(file) === ".py" && file.startsWith("protocol") && (await statAsync(resolve(dir, file))).isFile()) {
      const version: number = parseInt(file.substr(8).split(".").shift() as string, 10);
      await writeFileAsync(resolve(out, `protocol${version}.js`),
                           Generate((await readFileAsync(resolve(dir, file))).toString(), version));
      console.log(`Saved ${resolve(out, `protocol${version}.js`)}`)
    }
  }
}

async function _(): Promise<void> {
  const fd: string = process.argv.pop() as string;
  if((await statAsync(fd)).isDirectory()) {
    await find(fd, process.argv.pop() as string);
    return;
  }

  console.log(Generate((await readFileAsync(fd)).toString(), parseInt(process.argv.pop() as string, 10)));
}

_().catch((x) => { throw x; });
