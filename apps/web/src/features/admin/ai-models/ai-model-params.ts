export const AI_MODEL_PAGE_SIZES = [10, 25, 50];

export const AI_MODEL_LIST_SORTS = ["feature", "model", "price", "changed"] as const;

export type AiModelListSort = (typeof AI_MODEL_LIST_SORTS)[number];

export type AiModelSearchParams = Record<string, string | string[] | undefined>;

export const AI_MODEL_PARAM_KEYS = ["page", "pageSize", "sort", "dir", "q"] as const;

export type AiModelParamKey = (typeof AI_MODEL_PARAM_KEYS)[number];

export type AiModelViewParams = {
  page: number;
  pageSize: number;
  sort: AiModelListSort;
  direction: "asc" | "desc";
  q?: string | undefined;
};

const first = ({ value }: { value: string | string[] | undefined }): string | undefined =>
  Array.isArray(value) ? value[0] : value || undefined;

const positive = ({ value }: { value: string | undefined }) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : undefined;
};

export type ParseAiModelParamsInput = { params: AiModelSearchParams };

/**
 * `/admin/ai-models` URL state: page, size, search, and sort.
 * Hand-edited values fall back to defaults instead of erroring.
 */
export function parseAiModelParams({ params }: ParseAiModelParamsInput): AiModelViewParams {
  const size = positive({ value: first({ value: params.pageSize }) });
  const sortCandidate = first({ value: params.sort });
  const sort = AI_MODEL_LIST_SORTS.find((key) => key === sortCandidate) ?? "feature";
  const dir = first({ value: params.dir ?? params.direction });
  const q = first({ value: params.q })?.trim();
  const pageCandidate = positive({ value: first({ value: params.page }) }) ?? 1;

  return {
    page: Math.min(pageCandidate, 10_000),
    pageSize: size && AI_MODEL_PAGE_SIZES.includes(size) ? size : (AI_MODEL_PAGE_SIZES[1] ?? 25),
    sort,
    direction: dir === "desc" ? "desc" : "asc",
    q: q || undefined,
  };
}
