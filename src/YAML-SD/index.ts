import {
  YAMLMap,
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
  const parsedData = parseCustomTags(data).contents 
  if (parsedData === null){
    throw new Error('parsed data cannot be null.')
  }
  return parsedData as YAMLMap
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
