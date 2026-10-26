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
  createWorkspace: WorkspaceResult;
};

export type MutationCreateWorkspaceArgs = {
  input: CreateWorkspaceInput;
};

export type Query = {
  __typename?: 'Query';
  health: Scalars['Boolean']['output'];
  me?: Maybe<Me>;
};

export type User = {
  __typename?: 'User';
  email: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  image?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
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
  CreateWorkspaceInput: CreateWorkspaceInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Me: ResolverTypeWrapper<Me>;
  Mutation: ResolverTypeWrapper<Record<PropertyKey, never>>;
  Query: ResolverTypeWrapper<Record<PropertyKey, never>>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  User: ResolverTypeWrapper<User>;
  Workspace: ResolverTypeWrapper<Workspace>;
  WorkspaceErrorCode: WorkspaceErrorCode;
  WorkspaceErrorResult: ResolverTypeWrapper<WorkspaceErrorResult>;
  WorkspaceResult: ResolverTypeWrapper<WorkspaceResult>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  CreateWorkspaceInput: CreateWorkspaceInput;
  ID: Scalars['ID']['output'];
  Me: Me;
  Mutation: Record<PropertyKey, never>;
  Query: Record<PropertyKey, never>;
  String: Scalars['String']['output'];
  User: User;
  Workspace: Workspace;
  WorkspaceErrorResult: WorkspaceErrorResult;
  WorkspaceResult: WorkspaceResult;
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
  createWorkspace?: Resolver<
    ResolversTypes['WorkspaceResult'],
    ParentType,
    ContextType,
    RequireFields<MutationCreateWorkspaceArgs, 'input'>
  >;
};

export type QueryResolvers<
  ContextType = RequestContext,
  ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']
> = {
  health?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  me?: Resolver<Maybe<ResolversTypes['Me']>, ParentType, ContextType>;
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
  Me?: MeResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  Workspace?: WorkspaceResolvers<ContextType>;
  WorkspaceErrorResult?: WorkspaceErrorResultResolvers<ContextType>;
  WorkspaceResult?: WorkspaceResultResolvers<ContextType>;
};
