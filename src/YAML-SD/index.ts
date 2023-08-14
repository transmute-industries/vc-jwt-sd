import {
  parse,
  stringify,
} from "yaml";

import { parseCustomTags } from "./parseCustomTags";
import { yamlOptions } from './yamlOptions'

import { issuancePayload } from './issuancePayload'
import { disclose } from "./disclose";
import { tokenToSchema } from "./tokenToSchema"

const dumps = (data: any) => {
  return stringify(data, yamlOptions);
};

const roughlyEqual = (a: string, b: string) => {
  return JSON.stringify(parse(a)) === JSON.stringify(parse(b));
};

const load = (data: string) => {
  return parseCustomTags(data).contents
}

const YAML = {
  load,
  tokenToSchema,
  issuancePayload,
  parseCustomTags,
  loads: parse,
  dumps,
  disclose,
  roughlyEqual,
};

export default YAML;
