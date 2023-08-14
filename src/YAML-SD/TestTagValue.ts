import { discloseValue } from './constants'

export class TestTagValue {
  public key: string
  constructor(public value: object | string | number) {
    this.key = discloseValue
  }
  toJSON() {
    return { [discloseValue]: "..." };
  }
  toString() {
    return discloseValue;
  }
  // todo add a method for computing the disclosed hash here...
}

