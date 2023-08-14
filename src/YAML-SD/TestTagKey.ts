import {discloseKey } from './constants'
export class TestTagKey {
  constructor(public value: object | string | number) {}
  toJSON() {
    return { [discloseKey]: "..." };
  }
  toString() {
    return discloseKey;
  }
}