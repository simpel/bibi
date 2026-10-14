export type DataTablePaginationState = { pageIndex: number; pageSize: number };

export type DataTableLabels = {
  rowsPerPage: string;
  pageOf: (page: number, pageCount: number) => string;
  first: string;
  previous: string;
  next: string;
  last: string;
  total: (count: number) => string;
};
