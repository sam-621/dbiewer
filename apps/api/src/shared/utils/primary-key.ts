export const isPrimaryKey = (primaryKeyColumns: string[], columns: string[]) =>
  primaryKeyColumns.length > 0 &&
  columns.length === primaryKeyColumns.length &&
  primaryKeyColumns.every(column => columns.includes(column));
