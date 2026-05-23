import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { ActivityItem, Article, ArticleApproval, ArticleInput, ArticleList, ArticleUpdate, AuthResponse, DashboardStats, HealthStatus, ListArticlesParams, ListNewslettersParams, ListUsersParams, LoginInput, Logout200, MySubscriptions, Newsletter, NewsletterInput, NewsletterUpdate, Publisher, PublisherInput, PublisherUpdate, RegisterInput, SubscriptionStatus, User, UserProfile, UserUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRegisterUrl: () => string;
/**
 * @summary Register a new user
 */
export declare const register: (registerInput: RegisterInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getRegisterMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterInput>;
export type RegisterMutationError = ErrorType<void>;
/**
* @summary Register a new user
*/
export declare const useRegister: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export declare const getLoginUrl: () => string;
/**
 * @summary Login
 */
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<void>;
/**
* @summary Login
*/
export declare const useLogin: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export declare const getLogoutUrl: () => string;
/**
 * @summary Logout
 */
export declare const logout: (options?: RequestInit) => Promise<Logout200>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
* @summary Logout
*/
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export declare const getGetMeUrl: () => string;
/**
 * @summary Get current user profile
 */
export declare const getMe: (options?: RequestInit) => Promise<UserProfile>;
export declare const getGetMeQueryKey: () => readonly ["/api/users/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<void>;
/**
 * @summary Get current user profile
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateMeUrl: () => string;
/**
 * @summary Update current user profile
 */
export declare const updateMe: (userUpdate: UserUpdate, options?: RequestInit) => Promise<UserProfile>;
export declare const getUpdateMeMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMe>>, TError, {
        data: BodyType<UserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateMe>>, TError, {
    data: BodyType<UserUpdate>;
}, TContext>;
export type UpdateMeMutationResult = NonNullable<Awaited<ReturnType<typeof updateMe>>>;
export type UpdateMeMutationBody = BodyType<UserUpdate>;
export type UpdateMeMutationError = ErrorType<unknown>;
/**
* @summary Update current user profile
*/
export declare const useUpdateMe: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateMe>>, TError, {
        data: BodyType<UserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateMe>>, TError, {
    data: BodyType<UserUpdate>;
}, TContext>;
export declare const getListUsersUrl: (params?: ListUsersParams) => string;
/**
 * @summary List all users (journalists and editors)
 */
export declare const listUsers: (params?: ListUsersParams, options?: RequestInit) => Promise<User[]>;
export declare const getListUsersQueryKey: (params?: ListUsersParams) => readonly ["/api/users", ...ListUsersParams[]];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List all users (journalists and editors)
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetUserUrl: (userId: number) => string;
/**
 * @summary Get user by ID
 */
export declare const getUser: (userId: number, options?: RequestInit) => Promise<UserProfile>;
export declare const getGetUserQueryKey: (userId: number) => readonly [`/api/users/${number}`];
export declare const getGetUserQueryOptions: <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<void>>(userId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type GetUserQueryError = ErrorType<void>;
/**
 * @summary Get user by ID
 */
export declare function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<void>>(userId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListPublishersUrl: () => string;
/**
 * @summary List all publishers
 */
export declare const listPublishers: (options?: RequestInit) => Promise<Publisher[]>;
export declare const getListPublishersQueryKey: () => readonly ["/api/publishers"];
export declare const getListPublishersQueryOptions: <TData = Awaited<ReturnType<typeof listPublishers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPublishers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPublishers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPublishersQueryResult = NonNullable<Awaited<ReturnType<typeof listPublishers>>>;
export type ListPublishersQueryError = ErrorType<unknown>;
/**
 * @summary List all publishers
 */
export declare function useListPublishers<TData = Awaited<ReturnType<typeof listPublishers>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPublishers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePublisherUrl: () => string;
/**
 * @summary Create a publisher
 */
export declare const createPublisher: (publisherInput: PublisherInput, options?: RequestInit) => Promise<Publisher>;
export declare const getCreatePublisherMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPublisher>>, TError, {
        data: BodyType<PublisherInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPublisher>>, TError, {
    data: BodyType<PublisherInput>;
}, TContext>;
export type CreatePublisherMutationResult = NonNullable<Awaited<ReturnType<typeof createPublisher>>>;
export type CreatePublisherMutationBody = BodyType<PublisherInput>;
export type CreatePublisherMutationError = ErrorType<unknown>;
/**
* @summary Create a publisher
*/
export declare const useCreatePublisher: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPublisher>>, TError, {
        data: BodyType<PublisherInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPublisher>>, TError, {
    data: BodyType<PublisherInput>;
}, TContext>;
export declare const getGetPublisherUrl: (publisherId: number) => string;
/**
 * @summary Get publisher by ID
 */
export declare const getPublisher: (publisherId: number, options?: RequestInit) => Promise<Publisher>;
export declare const getGetPublisherQueryKey: (publisherId: number) => readonly [`/api/publishers/${number}`];
export declare const getGetPublisherQueryOptions: <TData = Awaited<ReturnType<typeof getPublisher>>, TError = ErrorType<void>>(publisherId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublisher>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPublisher>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPublisherQueryResult = NonNullable<Awaited<ReturnType<typeof getPublisher>>>;
export type GetPublisherQueryError = ErrorType<void>;
/**
 * @summary Get publisher by ID
 */
export declare function useGetPublisher<TData = Awaited<ReturnType<typeof getPublisher>>, TError = ErrorType<void>>(publisherId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPublisher>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdatePublisherUrl: (publisherId: number) => string;
/**
 * @summary Update publisher
 */
export declare const updatePublisher: (publisherId: number, publisherUpdate: PublisherUpdate, options?: RequestInit) => Promise<Publisher>;
export declare const getUpdatePublisherMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePublisher>>, TError, {
        publisherId: number;
        data: BodyType<PublisherUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePublisher>>, TError, {
    publisherId: number;
    data: BodyType<PublisherUpdate>;
}, TContext>;
export type UpdatePublisherMutationResult = NonNullable<Awaited<ReturnType<typeof updatePublisher>>>;
export type UpdatePublisherMutationBody = BodyType<PublisherUpdate>;
export type UpdatePublisherMutationError = ErrorType<unknown>;
/**
* @summary Update publisher
*/
export declare const useUpdatePublisher: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePublisher>>, TError, {
        publisherId: number;
        data: BodyType<PublisherUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePublisher>>, TError, {
    publisherId: number;
    data: BodyType<PublisherUpdate>;
}, TContext>;
export declare const getListArticlesUrl: (params?: ListArticlesParams) => string;
/**
 * @summary List approved articles
 */
export declare const listArticles: (params?: ListArticlesParams, options?: RequestInit) => Promise<ArticleList>;
export declare const getListArticlesQueryKey: (params?: ListArticlesParams) => readonly ["/api/articles", ...ListArticlesParams[]];
export declare const getListArticlesQueryOptions: <TData = Awaited<ReturnType<typeof listArticles>>, TError = ErrorType<unknown>>(params?: ListArticlesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listArticles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listArticles>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListArticlesQueryResult = NonNullable<Awaited<ReturnType<typeof listArticles>>>;
export type ListArticlesQueryError = ErrorType<unknown>;
/**
 * @summary List approved articles
 */
export declare function useListArticles<TData = Awaited<ReturnType<typeof listArticles>>, TError = ErrorType<unknown>>(params?: ListArticlesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listArticles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateArticleUrl: () => string;
/**
 * @summary Create an article (journalists only)
 */
export declare const createArticle: (articleInput: ArticleInput, options?: RequestInit) => Promise<Article>;
export declare const getCreateArticleMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createArticle>>, TError, {
        data: BodyType<ArticleInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createArticle>>, TError, {
    data: BodyType<ArticleInput>;
}, TContext>;
export type CreateArticleMutationResult = NonNullable<Awaited<ReturnType<typeof createArticle>>>;
export type CreateArticleMutationBody = BodyType<ArticleInput>;
export type CreateArticleMutationError = ErrorType<void>;
/**
* @summary Create an article (journalists only)
*/
export declare const useCreateArticle: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createArticle>>, TError, {
        data: BodyType<ArticleInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createArticle>>, TError, {
    data: BodyType<ArticleInput>;
}, TContext>;
export declare const getListSubscribedArticlesUrl: () => string;
/**
 * @summary List articles from reader subscriptions
 */
export declare const listSubscribedArticles: (options?: RequestInit) => Promise<Article[]>;
export declare const getListSubscribedArticlesQueryKey: () => readonly ["/api/articles/subscribed"];
export declare const getListSubscribedArticlesQueryOptions: <TData = Awaited<ReturnType<typeof listSubscribedArticles>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSubscribedArticles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listSubscribedArticles>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListSubscribedArticlesQueryResult = NonNullable<Awaited<ReturnType<typeof listSubscribedArticles>>>;
export type ListSubscribedArticlesQueryError = ErrorType<void>;
/**
 * @summary List articles from reader subscriptions
 */
export declare function useListSubscribedArticles<TData = Awaited<ReturnType<typeof listSubscribedArticles>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listSubscribedArticles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListPendingArticlesUrl: () => string;
/**
 * @summary List pending articles awaiting approval (editors only)
 */
export declare const listPendingArticles: (options?: RequestInit) => Promise<Article[]>;
export declare const getListPendingArticlesQueryKey: () => readonly ["/api/articles/pending"];
export declare const getListPendingArticlesQueryOptions: <TData = Awaited<ReturnType<typeof listPendingArticles>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPendingArticles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPendingArticles>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPendingArticlesQueryResult = NonNullable<Awaited<ReturnType<typeof listPendingArticles>>>;
export type ListPendingArticlesQueryError = ErrorType<void>;
/**
 * @summary List pending articles awaiting approval (editors only)
 */
export declare function useListPendingArticles<TData = Awaited<ReturnType<typeof listPendingArticles>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPendingArticles>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetArticleUrl: (articleId: number) => string;
/**
 * @summary Get article by ID
 */
export declare const getArticle: (articleId: number, options?: RequestInit) => Promise<Article>;
export declare const getGetArticleQueryKey: (articleId: number) => readonly [`/api/articles/${number}`];
export declare const getGetArticleQueryOptions: <TData = Awaited<ReturnType<typeof getArticle>>, TError = ErrorType<void>>(articleId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getArticle>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getArticle>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetArticleQueryResult = NonNullable<Awaited<ReturnType<typeof getArticle>>>;
export type GetArticleQueryError = ErrorType<void>;
/**
 * @summary Get article by ID
 */
export declare function useGetArticle<TData = Awaited<ReturnType<typeof getArticle>>, TError = ErrorType<void>>(articleId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getArticle>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateArticleUrl: (articleId: number) => string;
/**
 * @summary Update article (author or editor)
 */
export declare const updateArticle: (articleId: number, articleUpdate: ArticleUpdate, options?: RequestInit) => Promise<Article>;
export declare const getUpdateArticleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateArticle>>, TError, {
        articleId: number;
        data: BodyType<ArticleUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateArticle>>, TError, {
    articleId: number;
    data: BodyType<ArticleUpdate>;
}, TContext>;
export type UpdateArticleMutationResult = NonNullable<Awaited<ReturnType<typeof updateArticle>>>;
export type UpdateArticleMutationBody = BodyType<ArticleUpdate>;
export type UpdateArticleMutationError = ErrorType<unknown>;
/**
* @summary Update article (author or editor)
*/
export declare const useUpdateArticle: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateArticle>>, TError, {
        articleId: number;
        data: BodyType<ArticleUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateArticle>>, TError, {
    articleId: number;
    data: BodyType<ArticleUpdate>;
}, TContext>;
export declare const getDeleteArticleUrl: (articleId: number) => string;
/**
 * @summary Delete article (author or editor)
 */
export declare const deleteArticle: (articleId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteArticleMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteArticle>>, TError, {
        articleId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteArticle>>, TError, {
    articleId: number;
}, TContext>;
export type DeleteArticleMutationResult = NonNullable<Awaited<ReturnType<typeof deleteArticle>>>;
export type DeleteArticleMutationError = ErrorType<unknown>;
/**
* @summary Delete article (author or editor)
*/
export declare const useDeleteArticle: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteArticle>>, TError, {
        articleId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteArticle>>, TError, {
    articleId: number;
}, TContext>;
export declare const getApproveArticleUrl: (articleId: number) => string;
/**
 * @summary Approve or reject an article (editors only)
 */
export declare const approveArticle: (articleId: number, articleApproval: ArticleApproval, options?: RequestInit) => Promise<Article>;
export declare const getApproveArticleMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveArticle>>, TError, {
        articleId: number;
        data: BodyType<ArticleApproval>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof approveArticle>>, TError, {
    articleId: number;
    data: BodyType<ArticleApproval>;
}, TContext>;
export type ApproveArticleMutationResult = NonNullable<Awaited<ReturnType<typeof approveArticle>>>;
export type ApproveArticleMutationBody = BodyType<ArticleApproval>;
export type ApproveArticleMutationError = ErrorType<void>;
/**
* @summary Approve or reject an article (editors only)
*/
export declare const useApproveArticle: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof approveArticle>>, TError, {
        articleId: number;
        data: BodyType<ArticleApproval>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof approveArticle>>, TError, {
    articleId: number;
    data: BodyType<ArticleApproval>;
}, TContext>;
export declare const getListNewslettersUrl: (params?: ListNewslettersParams) => string;
/**
 * @summary List all newsletters
 */
export declare const listNewsletters: (params?: ListNewslettersParams, options?: RequestInit) => Promise<Newsletter[]>;
export declare const getListNewslettersQueryKey: (params?: ListNewslettersParams) => readonly ["/api/newsletters", ...ListNewslettersParams[]];
export declare const getListNewslettersQueryOptions: <TData = Awaited<ReturnType<typeof listNewsletters>>, TError = ErrorType<unknown>>(params?: ListNewslettersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNewsletters>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listNewsletters>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListNewslettersQueryResult = NonNullable<Awaited<ReturnType<typeof listNewsletters>>>;
export type ListNewslettersQueryError = ErrorType<unknown>;
/**
 * @summary List all newsletters
 */
export declare function useListNewsletters<TData = Awaited<ReturnType<typeof listNewsletters>>, TError = ErrorType<unknown>>(params?: ListNewslettersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listNewsletters>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateNewsletterUrl: () => string;
/**
 * @summary Create a newsletter (journalists only)
 */
export declare const createNewsletter: (newsletterInput: NewsletterInput, options?: RequestInit) => Promise<Newsletter>;
export declare const getCreateNewsletterMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createNewsletter>>, TError, {
        data: BodyType<NewsletterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createNewsletter>>, TError, {
    data: BodyType<NewsletterInput>;
}, TContext>;
export type CreateNewsletterMutationResult = NonNullable<Awaited<ReturnType<typeof createNewsletter>>>;
export type CreateNewsletterMutationBody = BodyType<NewsletterInput>;
export type CreateNewsletterMutationError = ErrorType<unknown>;
/**
* @summary Create a newsletter (journalists only)
*/
export declare const useCreateNewsletter: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createNewsletter>>, TError, {
        data: BodyType<NewsletterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createNewsletter>>, TError, {
    data: BodyType<NewsletterInput>;
}, TContext>;
export declare const getGetNewsletterUrl: (newsletterId: number) => string;
/**
 * @summary Get newsletter by ID
 */
export declare const getNewsletter: (newsletterId: number, options?: RequestInit) => Promise<Newsletter>;
export declare const getGetNewsletterQueryKey: (newsletterId: number) => readonly [`/api/newsletters/${number}`];
export declare const getGetNewsletterQueryOptions: <TData = Awaited<ReturnType<typeof getNewsletter>>, TError = ErrorType<void>>(newsletterId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNewsletter>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getNewsletter>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetNewsletterQueryResult = NonNullable<Awaited<ReturnType<typeof getNewsletter>>>;
export type GetNewsletterQueryError = ErrorType<void>;
/**
 * @summary Get newsletter by ID
 */
export declare function useGetNewsletter<TData = Awaited<ReturnType<typeof getNewsletter>>, TError = ErrorType<void>>(newsletterId: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getNewsletter>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateNewsletterUrl: (newsletterId: number) => string;
/**
 * @summary Update newsletter
 */
export declare const updateNewsletter: (newsletterId: number, newsletterUpdate: NewsletterUpdate, options?: RequestInit) => Promise<Newsletter>;
export declare const getUpdateNewsletterMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateNewsletter>>, TError, {
        newsletterId: number;
        data: BodyType<NewsletterUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateNewsletter>>, TError, {
    newsletterId: number;
    data: BodyType<NewsletterUpdate>;
}, TContext>;
export type UpdateNewsletterMutationResult = NonNullable<Awaited<ReturnType<typeof updateNewsletter>>>;
export type UpdateNewsletterMutationBody = BodyType<NewsletterUpdate>;
export type UpdateNewsletterMutationError = ErrorType<unknown>;
/**
* @summary Update newsletter
*/
export declare const useUpdateNewsletter: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateNewsletter>>, TError, {
        newsletterId: number;
        data: BodyType<NewsletterUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateNewsletter>>, TError, {
    newsletterId: number;
    data: BodyType<NewsletterUpdate>;
}, TContext>;
export declare const getDeleteNewsletterUrl: (newsletterId: number) => string;
/**
 * @summary Delete newsletter
 */
export declare const deleteNewsletter: (newsletterId: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteNewsletterMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteNewsletter>>, TError, {
        newsletterId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteNewsletter>>, TError, {
    newsletterId: number;
}, TContext>;
export type DeleteNewsletterMutationResult = NonNullable<Awaited<ReturnType<typeof deleteNewsletter>>>;
export type DeleteNewsletterMutationError = ErrorType<unknown>;
/**
* @summary Delete newsletter
*/
export declare const useDeleteNewsletter: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteNewsletter>>, TError, {
        newsletterId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteNewsletter>>, TError, {
    newsletterId: number;
}, TContext>;
export declare const getSubscribePublisherUrl: (publisherId: number) => string;
/**
 * @summary Subscribe to a publisher (readers only)
 */
export declare const subscribePublisher: (publisherId: number, options?: RequestInit) => Promise<SubscriptionStatus>;
export declare const getSubscribePublisherMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subscribePublisher>>, TError, {
        publisherId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof subscribePublisher>>, TError, {
    publisherId: number;
}, TContext>;
export type SubscribePublisherMutationResult = NonNullable<Awaited<ReturnType<typeof subscribePublisher>>>;
export type SubscribePublisherMutationError = ErrorType<unknown>;
/**
* @summary Subscribe to a publisher (readers only)
*/
export declare const useSubscribePublisher: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subscribePublisher>>, TError, {
        publisherId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof subscribePublisher>>, TError, {
    publisherId: number;
}, TContext>;
export declare const getUnsubscribePublisherUrl: (publisherId: number) => string;
/**
 * @summary Unsubscribe from a publisher
 */
export declare const unsubscribePublisher: (publisherId: number, options?: RequestInit) => Promise<SubscriptionStatus>;
export declare const getUnsubscribePublisherMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof unsubscribePublisher>>, TError, {
        publisherId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof unsubscribePublisher>>, TError, {
    publisherId: number;
}, TContext>;
export type UnsubscribePublisherMutationResult = NonNullable<Awaited<ReturnType<typeof unsubscribePublisher>>>;
export type UnsubscribePublisherMutationError = ErrorType<unknown>;
/**
* @summary Unsubscribe from a publisher
*/
export declare const useUnsubscribePublisher: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof unsubscribePublisher>>, TError, {
        publisherId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof unsubscribePublisher>>, TError, {
    publisherId: number;
}, TContext>;
export declare const getSubscribeJournalistUrl: (journalistId: number) => string;
/**
 * @summary Subscribe to a journalist (readers only)
 */
export declare const subscribeJournalist: (journalistId: number, options?: RequestInit) => Promise<SubscriptionStatus>;
export declare const getSubscribeJournalistMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subscribeJournalist>>, TError, {
        journalistId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof subscribeJournalist>>, TError, {
    journalistId: number;
}, TContext>;
export type SubscribeJournalistMutationResult = NonNullable<Awaited<ReturnType<typeof subscribeJournalist>>>;
export type SubscribeJournalistMutationError = ErrorType<unknown>;
/**
* @summary Subscribe to a journalist (readers only)
*/
export declare const useSubscribeJournalist: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof subscribeJournalist>>, TError, {
        journalistId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof subscribeJournalist>>, TError, {
    journalistId: number;
}, TContext>;
export declare const getUnsubscribeJournalistUrl: (journalistId: number) => string;
/**
 * @summary Unsubscribe from a journalist
 */
export declare const unsubscribeJournalist: (journalistId: number, options?: RequestInit) => Promise<SubscriptionStatus>;
export declare const getUnsubscribeJournalistMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof unsubscribeJournalist>>, TError, {
        journalistId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof unsubscribeJournalist>>, TError, {
    journalistId: number;
}, TContext>;
export type UnsubscribeJournalistMutationResult = NonNullable<Awaited<ReturnType<typeof unsubscribeJournalist>>>;
export type UnsubscribeJournalistMutationError = ErrorType<unknown>;
/**
* @summary Unsubscribe from a journalist
*/
export declare const useUnsubscribeJournalist: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof unsubscribeJournalist>>, TError, {
        journalistId: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof unsubscribeJournalist>>, TError, {
    journalistId: number;
}, TContext>;
export declare const getGetMySubscriptionsUrl: () => string;
/**
 * @summary Get current reader's subscriptions
 */
export declare const getMySubscriptions: (options?: RequestInit) => Promise<MySubscriptions>;
export declare const getGetMySubscriptionsQueryKey: () => readonly ["/api/subscriptions/me"];
export declare const getGetMySubscriptionsQueryOptions: <TData = Awaited<ReturnType<typeof getMySubscriptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMySubscriptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMySubscriptions>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMySubscriptionsQueryResult = NonNullable<Awaited<ReturnType<typeof getMySubscriptions>>>;
export type GetMySubscriptionsQueryError = ErrorType<unknown>;
/**
 * @summary Get current reader's subscriptions
 */
export declare function useGetMySubscriptions<TData = Awaited<ReturnType<typeof getMySubscriptions>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMySubscriptions>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetStatsUrl: () => string;
/**
 * @summary Get dashboard statistics
 */
export declare const getStats: (options?: RequestInit) => Promise<DashboardStats>;
export declare const getGetStatsQueryKey: () => readonly ["/api/stats"];
export declare const getGetStatsQueryOptions: <TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getStats>>>;
export type GetStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get dashboard statistics
 */
export declare function useGetStats<TData = Awaited<ReturnType<typeof getStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetRecentActivityUrl: () => string;
/**
 * @summary Get recent activity feed
 */
export declare const getRecentActivity: (options?: RequestInit) => Promise<ActivityItem[]>;
export declare const getGetRecentActivityQueryKey: () => readonly ["/api/stats/recent-activity"];
export declare const getGetRecentActivityQueryOptions: <TData = Awaited<ReturnType<typeof getRecentActivity>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getRecentActivity>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetRecentActivityQueryResult = NonNullable<Awaited<ReturnType<typeof getRecentActivity>>>;
export type GetRecentActivityQueryError = ErrorType<unknown>;
/**
 * @summary Get recent activity feed
 */
export declare function useGetRecentActivity<TData = Awaited<ReturnType<typeof getRecentActivity>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getRecentActivity>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map