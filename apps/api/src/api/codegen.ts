import type { GraphQLResolveInfo } from 'graphql';
import type { RequestContext } from '@/context';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

export type Connection = {
  __typename?: 'Connection';
  database: Scalars['String']['output'];
  hasPassword: Scalars['Boolean']['output'];
  host: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  port: Scalars['Int']['output'];
  sslMode: ConnectionSslMode;
  username: Scalars['String']['output'];
};

export type ConnectionErrorCode =
  'CONNECTION_NAME_ALREADY_EXISTS' | 'CONNECTION_NOT_FOUND' | 'INVALID_INPUT';

export type ConnectionErrorResult = {
  __typename?: 'ConnectionErrorResult';
  code: ConnectionErrorCode;
  message: Scalars['String']['output'];
};

export type ConnectionList = {
  __typename?: 'ConnectionList';
  items: Array<Connection>;
};

export type ConnectionResult = {
  __typename?: 'ConnectionResult';
  apiErrors: Array<ConnectionErrorResult>;
  connection?: Maybe<Connection>;
};

export type ConnectionSslMode = 'disable' | 'require' | 'verify-full';

export type CreateConnectionInput = {
  database: Scalars['String']['input'];
  host: Scalars['String']['input'];
  name: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  port: Scalars['Int']['input'];
  sslMode: ConnectionSslMode;
  username: Scalars['String']['input'];
};

export type CreateWorkspaceInput = {
  name: Scalars['String']['input'];
};

export type Me = {
  __typename?: 'Me';
  user: User;
  workspace?: Maybe<Workspace>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createConnection: ConnectionResult;
  createWorkspace: WorkspaceResult;
  removeConnection: RemoveConnectionResult;
  testConnection: TestConnectionResult;
  updateConnection: ConnectionResult;
  updateUserProfile: UserResult;
};

export type MutationCreateConnectionArgs = {
  input: CreateConnectionInput;
};

export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};

export type MutationRemoveConnectionArgs = {
  id: Scalars['ID']['input'];
};

export type MutationTestConnectionArgs = {
  input: TestConnectionInput;
};

export type MutationUpdateConnectionArgs = {
  input: UpdateConnectionInput;
};

export type MutationUpdateUserProfileArgs = {
  input: UpdateUserProfileInput;
};

export type Query = {
  __typename?: 'Query';
  connection?: Maybe<Connection>;
  connections: ConnectionList;
  health: Scalars['Boolean']['output'];
  me?: Maybe<Me>;
};

export type QueryConnectionArgs = {
  id: Scalars['ID']['input'];
};

export type RemoveConnectionResult = {
  __typename?: 'RemoveConnectionResult';
  apiErrors: Array<ConnectionErrorResult>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type TestConnectionInput = {
  database?: InputMaybe<Scalars['String']['input']>;
  host?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  port?: InputMaybe<Scalars['Int']['input']>;
  sslMode?: InputMaybe<ConnectionSslMode>;
  username?: InputMaybe<Scalars['String']['input']>;
};

export type TestConnectionResult = {
  __typename?: 'TestConnectionResult';
  apiErrors: Array<ConnectionErrorResult>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type UpdateConnectionInput = {
  database: Scalars['String']['input'];
  host: Scalars['String']['input'];
  id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
  password?: InputMaybe<Scalars['String']['input']>;
  port: Scalars['Int']['input'];
  sslMode: ConnectionSslMode;
  username: Scalars['String']['input'];
};

export type UpdateUserProfileInput = {
  name: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type UserErrorCode = 'USER_NAME_REQUIRED' | 'USER_NAME_TOO_LONG';

export type UserErrorResult = {
  __typename?: 'UserErrorResult';
  code: UserErrorCode;
  message: Scalars['String']['output'];
};

export type UserResult = {
  __typename?: 'UserResult';
  apiErrors: Array<UserErrorResult>;
  user?: Maybe<User>;
};

export type Workspace = {
  __typename?: 'Workspace';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
};

export type WorkspaceErrorCode = 'WORKSPACE_ALREADY_EXISTS';

export type WorkspaceErrorResult = {
  __typename?: 'WorkspaceErrorResult';
  code: WorkspaceErrorCode;
  message: Scalars['String']['output'];
};

export type WorkspaceResult = {
  __typename?: 'WorkspaceResult';
  apiErrors: Array<WorkspaceErrorResult>;
  workspace?: Maybe<Workspace>;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<
  TResult,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>
> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<
  TResult,
  TKey extends string,
  TParent,
  TContext,
  TArgs
> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<
  TResult,
  TKey extends string,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>
> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<
  TTypes,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>
> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<
  T = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>
> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<
  TResult = Record<PropertyKey, never>,
  TParent = Record<PropertyKey, never>,
  TContext = Record<PropertyKey, never>,
  TArgs = Record<PropertyKey, never>
> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Connection: ResolverTypeWrapper<Connection>;
  ConnectionErrorCode: ConnectionErrorCode;
  ConnectionErrorResult: ResolverTypeWrapper<ConnectionErrorResult>;
  ConnectionList: ResolverTypeWrapper<ConnectionList>;
  ConnectionResult: ResolverTypeWrapper<ConnectionResult>;
  ConnectionSslMode: null;
  CreateConnectionInput: CreateConnectionInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Me: ResolverTypeWrapper<Me>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  RemoveConnectionResult: ResolverTypeWrapper<RemoveConnectionResult>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  TestConnectionInput: TestConnectionInput;
  TestConnectionResult: ResolverTypeWrapper<TestConnectionResult>;
  UpdateConnectionInput: UpdateConnectionInput;
  UpdateUserProfileInput: UpdateUserProfileInput;
  User: ResolverTypeWrapper<User>;
  UserErrorCode: UserErrorCode;
  UserErrorResult: ResolverTypeWrapper<UserErrorResult>;
  UserResult: ResolverTypeWrapper<UserResult>;
  Workspace: ResolverTypeWrapper<Workspace>;
  WorkspaceErrorCode: WorkspaceErrorCode;
  WorkspaceErrorResult: ResolverTypeWrapper<WorkspaceErrorResult>;
  WorkspaceResult: ResolverTypeWrapper<WorkspaceResult>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Connection: Connection;
  ConnectionErrorResult: ConnectionErrorResult;
  ConnectionList: ConnectionList;
  ConnectionResult: ConnectionResult;
  CreateConnectionInput: CreateConnectionInput;
  CreateWorkspaceInput: CreateWorkspaceInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Me: Me;
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  RemoveConnectionResult: RemoveConnectionResult;
  String: Scalars['String']['output'];
  TestConnectionInput: TestConnectionInput;
  TestConnectionResult: TestConnectionResult;
  UpdateConnectionInput: UpdateConnectionInput;
  UpdateUserProfileInput: UpdateUserProfileInput;
  User: User;
  UserErrorResult: UserErrorResult;
  UserResult: UserResult;
  Workspace: Workspace;
  WorkspaceErrorResult: WorkspaceErrorResult;
  WorkspaceResult: WorkspaceResult;
};

export type ConnectionResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['Connection'] = ResolversParentTypes['Connection']
> = {
  database?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasPassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  host?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  port?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  sslMode?: Resolver<ResolversTypes['ConnectionSslMode'], ParentType, ContextType>;
  username?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ConnectionErrorResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['ConnectionErrorResult'] =
    ResolversParentTypes['ConnectionErrorResult']
> = {
  code?: Resolver<ResolversTypes['ConnectionErrorCode'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type ConnectionListResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['ConnectionList'] = ResolversParentTypes['ConnectionList']
> = {
  items?: Resolver<Array<ResolversTypes['Connection']>, ParentType, ContextType>;
};

export type ConnectionResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['ConnectionResult'] =
    ResolversParentTypes['ConnectionResult']
> = {
  apiErrors?: Resolver<Array<ResolversTypes['ConnectionErrorResult']>, ParentType, ContextType>;
  connection?: Resolver<Maybe<ResolversTypes['Connection']>, ParentType, ContextType>;
};

export type ConnectionSslModeResolvers = {
  DISABLE: 'disable';
  REQUIRE: 'require';
  VERIFY_FULL: 'verify-full';
};

export type MeResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['Me'] = ResolversParentTypes['Me']
> = {
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
};

export type MutationResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']
> = {
  createConnection?: Resolver<
    ResolversTypes['ConnectionResult'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateConnectionArgs, 'input'>
  >;
  createWorkspace?: Resolver<
    ResolversTypes['WorkspaceResult'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateWorkspaceArgs, 'input'>
  >;
  removeConnection?: Resolver<
    ResolversTypes['RemoveConnectionResult'],
    ParentType,
    ContextType,
    RequireFields<MutationRemoveConnectionArgs, 'id'>
  >;
  testConnection?: Resolver<
    ResolversTypes['TestConnectionResult'],
    ParentType,
    ContextType,
    RequireFields<MutationTestConnectionArgs, 'input'>
  >;
  updateConnection?: Resolver<
    ResolversTypes['ConnectionResult'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateConnectionArgs, 'input'>
  >;
  updateUserProfile?: Resolver<
    ResolversTypes['UserResult'],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateUserProfileArgs, 'input'>
  >;
};

export type QueryResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
  connection?: Resolver<
    Maybe<ResolversTypes['Connection']>,
    ParentType,
    ContextType,
    RequireFields<QueryConnectionArgs, 'id'>
  >;
  connections?: Resolver<ResolversTypes['ConnectionList'], ParentType, ContextType>;
  health?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
};

export type RemoveConnectionResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['RemoveConnectionResult'] =
    ResolversParentTypes['RemoveConnectionResult']
> = {
  apiErrors?: Resolver<Array<ResolversTypes['ConnectionErrorResult']>, ParentType, ContextType>;
  success?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type TestConnectionResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['TestConnectionResult'] =
    ResolversParentTypes['TestConnectionResult']
> = {
  apiErrors?: Resolver<Array<ResolversTypes['ConnectionErrorResult']>, ParentType, ContextType>;
  success?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
};

export type UserResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']
> = {
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type UserErrorResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['UserErrorResult'] =
    ResolversParentTypes['UserErrorResult']
> = {
  code?: Resolver<ResolversTypes['UserErrorCode'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type UserResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['UserResult'] = ResolversParentTypes['UserResult']
> = {
  apiErrors?: Resolver<Array<ResolversTypes['UserErrorResult']>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
};

export type WorkspaceResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['Workspace'] = ResolversParentTypes['Workspace']
> = {
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type WorkspaceErrorResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['WorkspaceErrorResult'] =
    ResolversParentTypes['WorkspaceErrorResult']
> = {
  code?: Resolver<ResolversTypes['WorkspaceErrorCode'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type WorkspaceResultResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['WorkspaceResult'] =
    ResolversParentTypes['WorkspaceResult']
> = {
  apiErrors?: Resolver<Array<ResolversTypes['WorkspaceErrorResult']>, ParentType, ContextType>;
  workspace?: Resolver<Maybe<ResolversTypes['Workspace']>, ParentType, ContextType>;
};

export type Resolvers<ContextType = RequestContext> = {
  Connection?: ConnectionResolvers<ContextType>;
  ConnectionErrorResult?: ConnectionErrorResultResolvers<ContextType>;
  ConnectionList?: ConnectionListResolvers<ContextType>;
  ConnectionResult?: ConnectionResultResolvers<ContextType>;
  ConnectionSslMode?: ConnectionSslModeResolvers;
  Me?: MeResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  RemoveConnectionResult?: RemoveConnectionResultResolvers<ContextType>;
  TestConnectionResult?: TestConnectionResultResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserErrorResult?: UserErrorResultResolvers<ContextType>;
  UserResult?: UserResultResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
  WorkspaceErrorResult?: WorkspaceErrorResultResolvers<ContextType>;
  WorkspaceResult?: WorkspaceResultResolvers<ContextType>;
};
