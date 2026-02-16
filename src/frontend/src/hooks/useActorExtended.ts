import { useInternetIdentity } from './useInternetIdentity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { type backendInterface, UserRole } from '../backend';
import { createActorWithConfig } from '../config';
import { getSecretParameter } from '../utils/urlParams';

const ACTOR_QUERY_KEY = 'actor';

/**
 * Extended version of useActor that exposes additional query state
 * This duplicates the actor initialization logic to provide error handling and retry capabilities
 */
export function useActorExtended() {
    const { identity } = useInternetIdentity();
    const queryClient = useQueryClient();
    
    const actorQuery = useQuery<backendInterface>({
        queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
        queryFn: async () => {
            const isAuthenticated = !!identity;

            if (!isAuthenticated) {
                // Return anonymous actor if not authenticated
                return await createActorWithConfig();
            }

            const actorOptions = {
                agentOptions: {
                    identity
                }
            };

            const actor = await createActorWithConfig(actorOptions);
            
            // Try to initialize access control, but don't fail if it errors
            try {
                const adminToken = getSecretParameter('caffeineAdminToken') || '';
                if (adminToken && adminToken.trim() !== '') {
                    // Only attempt admin initialization if a token is explicitly provided
                    await actor.assignCallerUserRole(identity.getPrincipal(), UserRole.admin);
                }
            } catch (error) {
                // Log but don't throw - allow actor to be used even if admin init fails
                console.warn('Access control initialization failed (non-fatal):', error);
            }
            
            return actor;
        },
        // Only refetch when identity changes
        staleTime: Infinity,
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
        enabled: true
    });

    // When the actor changes, invalidate dependent queries
    useEffect(() => {
        if (actorQuery.data) {
            queryClient.invalidateQueries({
                predicate: (query) => {
                    return !query.queryKey.includes(ACTOR_QUERY_KEY);
                }
            });
            queryClient.refetchQueries({
                predicate: (query) => {
                    return !query.queryKey.includes(ACTOR_QUERY_KEY);
                }
            });
        }
    }, [actorQuery.data, queryClient]);
    
    // We treat the actor as "ready" when it exists and is not fetching
    const isReady = !!actorQuery.data && !actorQuery.isFetching;
    const isLoading = actorQuery.isFetching;
    
    return {
        actor: actorQuery.data || null,
        isFetching: actorQuery.isFetching,
        isLoading,
        isError: actorQuery.isError,
        error: actorQuery.error || null,
        status: actorQuery.status,
        refetch: actorQuery.refetch,
        isReady,
    };
}
