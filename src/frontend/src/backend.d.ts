import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface AppStatistics {
    totalChannelsCreated: bigint;
    totalMessagesSent: bigint;
    totalRegisteredUsers: bigint;
    totalXpGained: bigint;
}
export interface ChannelWithMembers {
    creator: Principal;
    allowRandomJoin: boolean;
    name: string;
    createdAt: Time;
    memberCount: bigint;
    maxMembers?: bigint;
    isPrivate: boolean;
}
export type Time = bigint;
export interface Message {
    content: string;
    sender: Principal;
    timestamp: Time;
    channel: string;
    attachments: Array<Attachment>;
}
export interface Channel {
    creator: Principal;
    allowRandomJoin: boolean;
    name: string;
    createdAt: Time;
    maxMembers?: bigint;
    isPrivate: boolean;
}
export interface Attachment {
    id: string;
    file: ExternalBlob;
    type: AttachmentType;
}
export interface UserProfile {
    xp: bigint;
    username: string;
    level: bigint;
    joinedChannels: Array<string>;
}
export enum AttachmentType {
    gif = "gif",
    voice = "voice",
    document_ = "document",
    image = "image"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChannel(name: string, isPrivate: boolean): Promise<void>;
    getAccessibleChannels(): Promise<Array<ChannelWithMembers>>;
    getCallerUserLevelProgress(): Promise<[bigint, number]>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannelDetails(channelName: string): Promise<Channel | null>;
    getChannelMemberLimit(channelName: string): Promise<bigint | null>;
    getChannelMessages(channel: string): Promise<Array<Message>>;
    getGlobalAppStatistics(): Promise<AppStatistics>;
    getRandomJoinEnabled(channelName: string): Promise<boolean>;
    getUserChannels(user: Principal): Promise<Array<string>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserXPAndLevel(): Promise<[bigint, bigint]>;
    getUsername(user: Principal): Promise<string | null>;
    isCallerAdmin(): Promise<boolean>;
    isChannelAdmin(channelName: string): Promise<boolean>;
    joinChannel(name: string): Promise<void>;
    joinRandomChannel(): Promise<string>;
    leaveChannel(name: string, shouldDelete: boolean | null): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(channel: string, content: string, attachments: Array<Attachment>): Promise<void>;
    setChannelMaxMembers(channelName: string, maxMembers: bigint | null): Promise<void>;
    setRandomJoinEnabled(channelName: string, isEnabled: boolean): Promise<void>;
    setUsername(username: string): Promise<void>;
    verifyChannelAdmin(channelName: string): Promise<boolean>;
}
