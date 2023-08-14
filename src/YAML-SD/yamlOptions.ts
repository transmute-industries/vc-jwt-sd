import { discloseTag } from "./constants";

const sdTag = {
  tag: discloseTag,
  resolve(str: string) {
    return str;
  },
};

export const yamlOptions = {
  flowCollectionPadding: false,
  schema: "core",
  customTags: [sdTag],
};
