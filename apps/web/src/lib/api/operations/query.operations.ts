import { graphql } from '../codegen';

export const RUN_QUERY_MUTATION = graphql(`
  mutation RunQuery($input: RunQueryInput!) {
    runQuery(input: $input) {
      apiErrors {
        code
        message
      }
      execution {
        columns {
          name
          type
        }
        rows
        rowCount
        isTruncated
        durationMs
        command
      }
    }
  }
`);
