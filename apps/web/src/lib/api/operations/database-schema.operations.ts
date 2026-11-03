import { graphql } from '../codegen';

export const GET_CONNECTION_SCHEMA_QUERY = graphql(`
  query GetConnectionSchema($connectionId: ID!) {
    connectionSchema(connectionId: $connectionId) {
      apiErrors {
        code
        message
      }
      schemas {
        name
        tables {
          name
          columns {
            name
            type
            isPrimaryKey
            isForeignKey
          }
        }
        views {
          name
          columns {
            name
            type
            isPrimaryKey
            isForeignKey
          }
        }
        functions {
          name
          arguments
          kind
        }
      }
    }
  }
`);

export const GET_TABLE_STRUCTURE_QUERY = graphql(`
  query GetTableStructure($input: DbObjectInput!) {
    tableStructure(input: $input) {
      apiErrors {
        code
        message
      }
      structure {
        columns {
          name
          type
          isNullable
          default
          isPrimaryKey
        }
        indexes {
          name
          definition
          isUnique
        }
        foreignKeys {
          columns
          referencedSchema
          referencedTable
          referencedColumns
          onDelete
        }
        definition
      }
    }
  }
`);

export const GET_TABLE_ROWS_QUERY = graphql(`
  query GetTableRows($input: TableRowsInput!) {
    tableRows(input: $input) {
      apiErrors {
        code
        message
      }
      tableRows {
        columns {
          name
          type
        }
        rows
        totalRows
      }
    }
  }
`);
