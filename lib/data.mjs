import {
 readFile,
 writeFile,
} from 'fs/promises'
import { join } from 'path'

export function data(rootPath) {
 return {
  async read(name) {
   const fullPath = join(
    rootPath,
    `${encodeURIComponent(name)}.json`
   )
   try {
    const contents = await readFile(fullPath, {
     encoding: 'utf-8',
    })
    return JSON.parse(contents)
   } catch (e) {
    return undefined
   }
  },
  async write(name, value) {
   const fullPath = join(
    rootPath,
    `${encodeURIComponent(name)}.json`
   )
   await writeFile(
    fullPath,
    JSON.stringify(value),
    { encoding: 'utf-8' }
   )
  },
 }
}
