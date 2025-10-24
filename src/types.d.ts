export type EnvChange = {
  added: { key: string; value: string }[];
  removed: { key: string; value: string }[];
  modified: { key: string; oldValue: string; newValue: string }[];
};
