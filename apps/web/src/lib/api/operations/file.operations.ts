import { graphql } from '../codegen';

export const COMMON_FILE_FRAGMENT = graphql(`
  fragment CommonFile on File {
    id
    name
    type
    content
    updatedAt
  }
`);

export const GET_FILES_QUERY = graphql(`
  query GetFiles($connectionId: ID!) {
    files(connectionId: $connectionId) {
      items {
        ...CommonFile
      }
    }
  }
`);

export const GET_FILE_QUERY = graphql(`
  query GetFile($id: ID!) {
    file(id: $id) {
      ...CommonFile
    }
  }
`);

export const SAVE_FILE_MUTATION = graphql(`
  mutation SaveFile($input: SaveFileInput!) {
    saveFile(input: $input) {
      apiErrors {
        code
        message
      }
      file {
        ...CommonFile
      }
    }
  }
`);

export const REMOVE_FILE_MUTATION = graphql(`
  mutation RemoveFile($id: ID!) {
    removeFile(id: $id) {
      apiErrors {
        code
        message
      }
      success
    }
  }
`);
