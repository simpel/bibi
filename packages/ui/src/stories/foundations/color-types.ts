export type ColorTokenDef = {
  name: string;
  variable: string;
  fgVariable?: string;
  role: string;
  description: string;
};

export type ColorGroup = {
  title: string;
  description: string;
  tokens: ColorTokenDef[];
};
