import { graphql } from '../codegen';

export const GET_ME_QUERY = graphql(`
  query GetMe {
    me {
      user {
        id
        name
        email
        image
      }
      workspace {
        id
        name
      }
    }
  }
`);

export const UPDATE_USER_PROFILE_MUTATION = graphql(`
  mutation UpdateUserProfile($input: UpdateUserProfileInput!) {
    updateUserProfile(input: $input) {
      apiErrors {
        code
        message
      }
      user {
        id
        name
      }
    }
  }
`);

export const CREATE_WORKSPACE_MUTATION = graphql(`
  mutation CreateWorkspace($input: CreateWorkspaceInput!) {
    createWorkspace(input: $input) {
      apiErrors {
        code
        message
      }
      workspace {
        id
        name
      }
    }
  }
`);
