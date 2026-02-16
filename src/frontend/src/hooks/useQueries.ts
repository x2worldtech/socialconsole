import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserProfile, Channel, Message, ChannelWithMembers, Attachment, AttachmentType, AppStatistics } from '../backend';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { useInternetIdentity } from './useInternetIdentity';
import { ExternalBlob } from '../backend';
import { useOnlineStatus } from './useOnlineStatus';

export function useGetGlobalAppStatistics() {
  const { actor, isFetching } = useActor();
  const isOnline = useOnlineStatus();

  return useQuery<AppStatistics>({
    queryKey: ['globalAppStatistics'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getGlobalAppStatistics();
    },
    enabled: !!actor && !isFetching && isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: isOnline ? 10000 : false,
    staleTime: 5000,
    placeholderData: (previousData) => previousData,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    // Only enable when authenticated and actor is ready
    enabled: !!actor && !actorFetching && !!identity && isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetCallerUserLevelProgress() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  return useQuery<{ level: number; progress: number }>({
    queryKey: ['userLevelProgress'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const [level, progress] = await actor.getCallerUserLevelProgress();
      return {
        level: Number(level),
        progress: progress,
      };
    },
    enabled: !!actor && !actorFetching && !!identity && isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: isOnline ? 5000 : false,
    staleTime: 2000,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!isOnline) throw new Error('Cannot save profile while offline');
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userLevelProgress'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to save profile');
    },
  });
}

export function useGetAccessibleChannels() {
  const { actor, isFetching } = useActor();
  const isOnline = useOnlineStatus();

  return useQuery<ChannelWithMembers[]>({
    queryKey: ['accessibleChannels'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        const channels = await actor.getAccessibleChannels();
        return channels;
      } catch (error: any) {
        console.error('Error fetching accessible channels:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: isOnline ? 5000 : false,
    staleTime: 2000,
    placeholderData: (previousData) => previousData,
  });
}

export function useGetUserChannels() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  return useQuery<string[]>({
    queryKey: ['userChannels', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      try {
        const channels = await actor.getUserChannels(identity.getPrincipal());
        return channels;
      } catch (error: any) {
        console.error('Error fetching user channels:', error);
        return [];
      }
    },
    enabled: !!actor && !isFetching && !!identity && isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: isOnline ? 5000 : false,
    staleTime: 2000,
    placeholderData: (previousData) => previousData,
  });
}

export function useGetChannelMessages(channelName: string | null) {
  const { actor, isFetching } = useActor();
  const isOnline = useOnlineStatus();

  return useQuery<Message[]>({
    queryKey: ['channelMessages', channelName],
    queryFn: async () => {
      if (!actor || !channelName) return [];
      try {
        const messages = await actor.getChannelMessages(channelName);
        return messages;
      } catch (error: any) {
        if (error.message?.includes('Not authorized') || error.message?.includes('Unauthorized')) {
          return [];
        }
        console.error('Error fetching channel messages:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching && !!channelName && isOnline,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: isOnline ? 3000 : false,
    staleTime: 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useIsChannelAdmin(channelName: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  return useQuery<boolean>({
    queryKey: ['isChannelAdmin', channelName],
    queryFn: async () => {
      if (!actor || !channelName || !identity) return false;
      try {
        return await actor.isChannelAdmin(channelName);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return false;
        }
        console.error('Error checking channel admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !isFetching && !!channelName && !!identity && isOnline,
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
  });
}

export function useGetRandomJoinEnabled(channelName: string | null) {
  const { actor, isFetching } = useActor();
  const isOnline = useOnlineStatus();

  return useQuery<boolean>({
    queryKey: ['randomJoinEnabled', channelName],
    queryFn: async () => {
      if (!actor || !channelName) return true;
      try {
        return await actor.getRandomJoinEnabled(channelName);
      } catch (error: any) {
        if (error.message?.includes('Unauthorized')) {
          return true;
        }
        console.error('Error fetching random join setting:', error);
        return true;
      }
    },
    enabled: !!actor && !isFetching && !!channelName && isOnline,
    retry: 2,
    retryDelay: 1000,
    staleTime: 10000,
  });
}

export function useSetRandomJoinEnabled() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ channelName, isEnabled }: { channelName: string; isEnabled: boolean }) => {
      if (!isOnline) throw new Error('Cannot update settings while offline');
      if (!actor) throw new Error('Actor not available');
      return actor.setRandomJoinEnabled(channelName, isEnabled);
    },
    onMutate: async ({ channelName, isEnabled }) => {
      await queryClient.cancelQueries({ queryKey: ['randomJoinEnabled', channelName] });
      const previousValue = queryClient.getQueryData<boolean>(['randomJoinEnabled', channelName]);
      
      queryClient.setQueryData<boolean>(['randomJoinEnabled', channelName], isEnabled);
      
      return { previousValue };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousValue !== undefined) {
        queryClient.setQueryData(['randomJoinEnabled', variables.channelName], context.previousValue);
      }
      toast.error(error.message || 'Failed to update channel settings');
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.isEnabled 
          ? 'Random joining enabled for this channel' 
          : 'Random joining disabled for this channel'
      );
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['randomJoinEnabled', variables.channelName] });
    },
  });
}

export function useGetChannelDetails(channelName: string | null) {
  const { actor, isFetching } = useActor();
  const isOnline = useOnlineStatus();

  return useQuery<Channel | null>({
    queryKey: ['channelDetails', channelName],
    queryFn: async () => {
      if (!actor || !channelName) return null;
      try {
        return await actor.getChannelDetails(channelName);
      } catch (error: any) {
        console.error('Error fetching channel details:', error);
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!channelName && isOnline,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5000,
  });
}

export function useSetChannelMaxMembers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ channelName, maxMembers }: { channelName: string; maxMembers: bigint | null }) => {
      if (!isOnline) throw new Error('Cannot update member limit while offline');
      if (!actor) throw new Error('Actor not available');
      return actor.setChannelMaxMembers(channelName, maxMembers);
    },
    onMutate: async ({ channelName, maxMembers }) => {
      await queryClient.cancelQueries({ queryKey: ['channelDetails', channelName] });
      const previousDetails = queryClient.getQueryData<Channel>(['channelDetails', channelName]);
      
      if (previousDetails) {
        queryClient.setQueryData<Channel>(['channelDetails', channelName], {
          ...previousDetails,
          maxMembers: maxMembers !== null ? maxMembers : undefined,
        });
      }
      
      return { previousDetails };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousDetails) {
        queryClient.setQueryData(['channelDetails', variables.channelName], context.previousDetails);
      }
      toast.error(error.message || 'Failed to update member limit');
    },
    onSuccess: (_, variables) => {
      if (variables.maxMembers === null) {
        toast.success('Member limit removed');
      } else {
        toast.success(`Member limit set to ${variables.maxMembers}`);
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channelDetails', variables.channelName] });
      queryClient.invalidateQueries({ queryKey: ['accessibleChannels'] });
    },
  });
}

export function useCreateChannel(onChannelCreated?: (channelName: string) => void) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!isOnline) throw new Error('Cannot create channels while offline');
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('You must be logged in to create channels');
      await actor.createChannel(name, false);
      return name;
    },
    onMutate: async (name: string) => {
      await queryClient.cancelQueries({ queryKey: ['accessibleChannels'] });
      await queryClient.cancelQueries({ queryKey: ['userChannels'] });

      const previousChannels = queryClient.getQueryData<ChannelWithMembers[]>(['accessibleChannels']);
      const previousUserChannels = queryClient.getQueryData<string[]>(['userChannels', identity?.getPrincipal().toString()]);

      if (identity) {
        const optimisticChannel: ChannelWithMembers = {
          name,
          creator: identity.getPrincipal(),
          createdAt: BigInt(Date.now() * 1000000),
          isPrivate: false,
          allowRandomJoin: true,
          memberCount: BigInt(1),
        };

        queryClient.setQueryData<ChannelWithMembers[]>(['accessibleChannels'], (old = []) => {
          if (old.some(ch => ch.name === name)) return old;
          return [...old, optimisticChannel];
        });
        
        queryClient.setQueryData<string[]>(['userChannels', identity.getPrincipal().toString()], (old = []) => {
          if (old.includes(name)) return old;
          return [...old, name];
        });
      }

      if (onChannelCreated) {
        onChannelCreated(name);
      }

      return { previousChannels, previousUserChannels };
    },
    onError: (error: Error, name, context) => {
      if (context?.previousChannels) {
        queryClient.setQueryData(['accessibleChannels'], context.previousChannels);
      }
      if (context?.previousUserChannels && identity) {
        queryClient.setQueryData(['userChannels', identity.getPrincipal().toString()], context.previousUserChannels);
      }
      if (error.message?.includes('logged in') || error.message?.includes('authenticated')) {
        toast.error('You must be logged in to create channels');
      } else {
        toast.error(error.message || 'Failed to create channel');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accessibleChannels'] });
      queryClient.invalidateQueries({ queryKey: ['userChannels'] });
      queryClient.invalidateQueries({ queryKey: ['globalAppStatistics'] });
    },
  });
}

export function useJoinChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!isOnline) throw new Error('Cannot join channels while offline');
      if (!actor) throw new Error('Actor not available');
      return actor.joinChannel(name);
    },
    onMutate: async (name: string) => {
      await queryClient.cancelQueries({ queryKey: ['userChannels'] });
      await queryClient.cancelQueries({ queryKey: ['accessibleChannels'] });

      const previousUserChannels = queryClient.getQueryData<string[]>(['userChannels', identity?.getPrincipal().toString()]);
      const previousAccessibleChannels = queryClient.getQueryData<ChannelWithMembers[]>(['accessibleChannels']);

      queryClient.setQueryData<string[]>(['userChannels', identity?.getPrincipal().toString()], (old = []) => {
        if (old.includes(name)) return old;
        return [...old, name];
      });

      return { previousUserChannels, previousAccessibleChannels };
    },
    onError: (error: Error, name, context) => {
      if (context?.previousUserChannels && identity) {
        queryClient.setQueryData(['userChannels', identity.getPrincipal().toString()], context.previousUserChannels);
      }
      if (context?.previousAccessibleChannels) {
        queryClient.setQueryData(['accessibleChannels'], context.previousAccessibleChannels);
      }
      
      if (error.message?.includes('Channel is full')) {
        toast.error(`Cannot join "${name}" - channel has reached maximum capacity`);
      } else {
        toast.error(error.message || 'Failed to join channel');
      }
    },
    onSuccess: (_, name) => {
      toast.success(`Joined channel "${name}" successfully`);
      queryClient.invalidateQueries({ queryKey: ['userLevelProgress'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accessibleChannels'] });
      queryClient.invalidateQueries({ queryKey: ['userChannels'] });
    },
  });
}

export function useJoinRandomChannel(onChannelJoined?: (channelName: string) => void) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async () => {
      if (!isOnline) throw new Error('Cannot join channels while offline');
      if (!actor) throw new Error('Actor not available');
      const channelName = await actor.joinRandomChannel();
      return channelName;
    },
    onSuccess: (channelName) => {
      toast.success(`Joined random channel "${channelName}" successfully`);
      queryClient.invalidateQueries({ queryKey: ['userLevelProgress'] });
      
      if (onChannelJoined) {
        onChannelJoined(channelName);
      }
    },
    onError: (error: Error) => {
      if (error.message?.includes('No available channels')) {
        toast.error('No available channels to join - all channels are either full or already joined');
      } else {
        toast.error(error.message || 'Failed to join random channel');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accessibleChannels'] });
      queryClient.invalidateQueries({ queryKey: ['userChannels'] });
    },
  });
}

export function useLeaveChannel(onChannelLeft?: (channelName: string) => void) {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ name, shouldDelete }: { name: string; shouldDelete?: boolean }) => {
      if (!isOnline) throw new Error('Cannot leave channels while offline');
      if (!actor) throw new Error('Actor not available');
      return actor.leaveChannel(name, shouldDelete ?? null);
    },
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: ['userChannels'] });
      await queryClient.cancelQueries({ queryKey: ['accessibleChannels'] });

      const previousUserChannels = queryClient.getQueryData<string[]>(['userChannels', identity?.getPrincipal().toString()]);
      const previousAccessibleChannels = queryClient.getQueryData<ChannelWithMembers[]>(['accessibleChannels']);

      queryClient.setQueryData<string[]>(['userChannels', identity?.getPrincipal().toString()], (old = []) => 
        old.filter(ch => ch !== name)
      );

      queryClient.setQueryData<ChannelWithMembers[]>(['accessibleChannels'], (old = []) => 
        old.filter(ch => ch.name !== name)
      );

      if (onChannelLeft) {
        onChannelLeft(name);
      }

      return { previousUserChannels, previousAccessibleChannels };
    },
    onError: (error: Error, { name }, context) => {
      if (context?.previousUserChannels && identity) {
        queryClient.setQueryData(['userChannels', identity.getPrincipal().toString()], context.previousUserChannels);
      }
      if (context?.previousAccessibleChannels) {
        queryClient.setQueryData(['accessibleChannels'], context.previousAccessibleChannels);
      }
      toast.error(error.message || 'Failed to leave channel');
    },
    onSuccess: (_, { name, shouldDelete }) => {
      if (shouldDelete) {
        toast.success(`Channel "${name}" deleted successfully`);
      } else {
        toast.success(`Left channel "${name}" successfully`);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['accessibleChannels'] });
      queryClient.invalidateQueries({ queryKey: ['userChannels'] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async ({ channel, content, attachments = [] }: { channel: string; content: string; attachments?: Array<{ id: string; type: AttachmentType; file: ExternalBlob }> }) => {
      if (!isOnline) throw new Error('Cannot send messages while offline');
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('You must be logged in to send messages');
      
      const backendAttachments: Attachment[] = attachments.map(att => ({
        id: att.id,
        type: att.type,
        file: att.file,
      }));
      
      return actor.sendMessage(channel, content, backendAttachments);
    },
    onMutate: async ({ channel, content, attachments = [] }) => {
      await queryClient.cancelQueries({ queryKey: ['channelMessages', channel] });

      const previousMessages = queryClient.getQueryData<Message[]>(['channelMessages', channel]);

      if (identity) {
        const optimisticMessage: Message = {
          sender: identity.getPrincipal(),
          content,
          timestamp: BigInt(Date.now() * 1000000),
          channel,
          attachments: attachments.map(att => ({
            id: att.id,
            type: att.type,
            file: att.file,
          })),
        };

        queryClient.setQueryData<Message[]>(['channelMessages', channel], (old = []) => [...old, optimisticMessage]);
      }

      return { previousMessages };
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['channelMessages', variables.channel], context.previousMessages);
      }
      if (error.message?.includes('logged in') || error.message?.includes('authenticated')) {
        toast.error('You must be logged in to send messages');
      } else {
        toast.error(error.message || 'Failed to send message');
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channelMessages', variables.channel] });
      queryClient.invalidateQueries({ queryKey: ['userLevelProgress'] });
      queryClient.invalidateQueries({ queryKey: ['globalAppStatistics'] });
    },
  });
}
