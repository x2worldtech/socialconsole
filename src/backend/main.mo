import Map "mo:core/Map";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Char "mo:core/Char";
import Iter "mo:core/Iter";
import Int "mo:core/Int";
import Runtime "mo:core/Runtime";
import Order "mo:core/Order";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";



actor {
  public type Channel = {
    name : Text;
    creator : Principal;
    createdAt : Time.Time;
    isPrivate : Bool;
    allowRandomJoin : Bool;
    maxMembers : ?Nat;
  };

  public type ChannelWithMembers = {
    name : Text;
    creator : Principal;
    createdAt : Time.Time;
    isPrivate : Bool;
    allowRandomJoin : Bool;
    maxMembers : ?Nat;
    memberCount : Nat;
  };

  public type Message = {
    sender : Principal;
    content : Text;
    timestamp : Time.Time;
    channel : Text;
    attachments : [Attachment];
  };

  public type Attachment = {
    id : Text;
    type_ : AttachmentType;
    file : Storage.ExternalBlob;
  };

  public type AttachmentType = {
    #image;
    #gif;
    #document;
    #voice;
  };

  public type UserProfile = {
    username : Text;
    joinedChannels : [Text];
    xp : Nat;
    level : Nat;
  };

  public type AppStatistics = {
    totalChannelsCreated : Nat;
    totalRegisteredUsers : Nat;
    totalMessagesSent : Nat;
    totalXpGained : Nat;
  };

  public type PersistentState = {
    channels : Map.Map<Text, Channel>;
    messages : Map.Map<Text, List.List<Message>>;
    userChannels : Map.Map<Principal, Set.Set<Text>>;
    userProfiles : Map.Map<Principal, UserProfile>;
    appStatistics : AppStatistics;
  };

  var persistentState : PersistentState = {
    channels = Map.empty<Text, Channel>();
    messages = Map.empty<Text, List.List<Message>>();
    userChannels = Map.empty<Principal, Set.Set<Text>>();
    userProfiles = Map.empty<Principal, UserProfile>();
    appStatistics = {
      totalChannelsCreated = 0;
      totalRegisteredUsers = 0;
      totalMessagesSent = 0;
      totalXpGained = 0;
    };
  };

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Storage
  include MixinStorage();

  func isCallerGuest(caller : Principal) : Bool {
    AccessControl.getUserRole(accessControlState, caller) == #guest;
  };

  func hasUserPermission(caller : Principal) : Bool {
    AccessControl.hasPermission(accessControlState, caller, #user);
  };

  func calculateLevel(xp : Nat) : Nat {
    let levelThresholds = [
      0 : Nat, 100, 250, 430, 640, 880, 1150, 1450, 1780, 2140, 2530, 2950, 3400, 3880, 4390, 4930, 5500, 6100,
      6730, 7390, 8080, 8800, 9550, 10330, 11140, 11980, 12850, 13750, 14680, 15640, 16630, 17650, 18700, 19780,
      20890, 22030, 23200, 24400, 25630, 26890, 28180, 29500, 30850, 32230, 33640, 35080, 36550, 38050, 39580,
      41140, 42730, 44350, 46000, 47680, 49390, 51130, 52900, 54700, 56530, 58390, 60280, 62200, 64150, 66130,
      68140, 70180, 72250, 74350, 76480, 78640, 80830, 83050, 85300, 87580, 89890, 92230, 94599, 96999, 99429,
      101889, 104379, 106899, 109449, 112029, 114639, 117279, 119949, 122649, 125379, 128139, 130929, 133749,
      136599, 139479, 142389, 145329, 148299, 151299, 154329, 157389, 160479, 163599, 166749, 169929
    ];
    var lvl = 0;
    for (i in Nat.range(0, levelThresholds.size())) {
      if (xp >= levelThresholds[i]) {
        lvl := i;
      } else {
        return lvl;
      };
    };
    lvl;
  };

  func calculateProgress(xp : Nat) : Float {
    let levelThresholds = [
      0 : Nat, 100, 250, 430, 640, 880, 1150, 1450, 1780, 2140, 2530, 2950, 3400, 3880, 4390, 4930, 5500, 6100,
      6730, 7390, 8080, 8800, 9550, 10330, 11140, 11980, 12850, 13750, 14680, 15640, 16630, 17650, 18700, 19780,
      20890, 22030, 23200, 24400, 25630, 26890, 28180, 29500, 30850, 32230, 33640, 35080, 36550, 38050, 39580,
      41140, 42730, 44350, 46000, 47680, 49390, 51130, 52900, 54700, 56530, 58390, 60280, 62200, 64150, 66130,
      68140, 70180, 72250, 74350, 76480, 78640, 80830, 83050, 85300, 87580, 89890, 92230, 94599, 96999, 99429,
      101889, 104379, 106899, 109449, 112029, 114639, 117279, 119949, 122649, 125379, 128139, 130929, 133749,
      136599, 139479, 142389, 145329, 148299, 151299, 154329, 157389, 160479, 163599, 166749, 169929
    ];
    let lvl = calculateLevel(xp);
    if (lvl + 1 >= levelThresholds.size()) { return 1.0 };
    let currentLevel = levelThresholds[lvl].toFloat();
    let nextLevel = levelThresholds[lvl + 1].toFloat();
    let xpFloat = xp.toFloat();
    (xpFloat - currentLevel) / (nextLevel - currentLevel);
  };

  func addUserXP(user : Principal, amount : Nat) {
    switch (persistentState.userProfiles.get(user)) {
      case (null) { () };
      case (?profile) {
        let newXP = profile.xp + amount;
        let newLevel = calculateLevel(newXP);
        let updatedProfile : UserProfile = {
          profile with
          xp = newXP;
          level = newLevel;
        };
        persistentState.userProfiles.add(user, updatedProfile);
        updateStatistics(0, 0, 0, amount);
      };
    };
  };

  func isAscii(text : Text) : Bool {
    for (char in text.chars()) {
      if (char.toNat32() >= 0x7F) { return false };
    };
    true;
  };

  func getChannelMemberCount(channelName : Text) : Nat {
    var count = 0;
    for (userChannels in persistentState.userChannels.values()) {
      if (userChannels.contains(channelName)) { count += 1 };
    };
    count;
  };

  func isUserInChannel(user : Principal, channelName : Text) : Bool {
    switch (persistentState.userChannels.get(user)) {
      case (null) { false };
      case (?channelsSet) { channelsSet.contains(channelName) };
    };
  };

  func updateStatistics(channelsCreated : Nat, registeredUsers : Nat, messagesSent : Nat, xpGained : Nat) {
    persistentState := {
      persistentState with
      appStatistics = {
        persistentState.appStatistics with
        totalChannelsCreated = persistentState.appStatistics.totalChannelsCreated + channelsCreated;
        totalRegisteredUsers = persistentState.appStatistics.totalRegisteredUsers + registeredUsers;
        totalMessagesSent = persistentState.appStatistics.totalMessagesSent + messagesSent;
        totalXpGained = persistentState.appStatistics.totalXpGained + xpGained;
      };
    };
  };

  public query func getGlobalAppStatistics() : async AppStatistics {
    persistentState.appStatistics;
  };

  public shared ({ caller }) func createChannel(name : Text, isPrivate : Bool) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can create channels");
    };

    if (not isAscii(name)) {
      Runtime.trap("Channel name must be ASCII only");
    };

    if (persistentState.channels.containsKey(name)) {
      Runtime.trap("Channel already exists");
    };

    let channel : Channel = {
      name;
      creator = caller;
      createdAt = Time.now();
      isPrivate;
      allowRandomJoin = true;
      maxMembers = null;
    };

    persistentState.channels.add(name, channel);
    persistentState.messages.add(name, List.empty<Message>());
    addUserToChannel(caller, name);
    updateStatistics(1, 0, 0, 0);
  };

  func addUserToChannel(user : Principal, channel : Text) {
    let channelsSet = switch (persistentState.userChannels.get(user)) {
      case (null) { Set.empty<Text>() };
      case (?existing) { existing };
    };
    channelsSet.add(channel);
    persistentState.userChannels.add(user, channelsSet);
  };

  public shared ({ caller }) func joinChannel(name : Text) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can join channels");
    };

    let channel = switch (persistentState.channels.get(name)) {
      case (null) { Runtime.trap("Channel does not exist") };
      case (?ch) { ch };
    };

    if (isUserInChannel(caller, name)) {
      Runtime.trap("Already a member of this channel");
    };

    switch (channel.maxMembers) {
      case (?limit) {
        let memberCount = getChannelMemberCount(name);
        if (memberCount >= limit) {
          Runtime.trap("Channel is full");
        };
      };
      case (null) {};
    };

    addUserToChannel(caller, name);

    if (not isCallerGuest(channel.creator)) {
      addUserXP(channel.creator, 10);
    };
  };

  public shared ({ caller }) func joinRandomChannel() : async Text {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can join channels");
    };

    let publicChannelsIter = persistentState.channels.values().filter(
      func(channel) { not channel.isPrivate and channel.allowRandomJoin }
    );
    let publicChannels = publicChannelsIter.toArray();
    if (publicChannels.size() == 0) {
      Runtime.trap("No public channels available");
    };

    let userChannelsSet = switch (persistentState.userChannels.get(caller)) {
      case (null) { Set.empty<Text>() };
      case (?existing) { existing };
    };

    let availableChannelsIter = publicChannels.values().filter(
      func(channel) { not userChannelsSet.contains(channel.name) }
    );
    let availableChannels = availableChannelsIter.toArray();

    let filteredChannelsIter = availableChannels.values().filter(
      func(channel) {
        switch (channel.maxMembers) {
          case (?limit) {
            let memberCount = getChannelMemberCount(channel.name);
            memberCount < limit;
          };
          case (null) { true };
        };
      }
    );
    let filteredChannels = filteredChannelsIter.toArray();

    if (filteredChannels.size() == 0) {
      Runtime.trap("No available channels to join");
    };

    let randomIndex = (Time.now() % filteredChannels.size().toInt()) % filteredChannels.size();
    let channelToJoin = filteredChannels[(randomIndex % filteredChannels.size().toInt()).toNat()];

    addUserToChannel(caller, channelToJoin.name);

    if (not isCallerGuest(channelToJoin.creator)) {
      addUserXP(channelToJoin.creator, 10);
    };
    channelToJoin.name;
  };

  public shared ({ caller }) func leaveChannel(name : Text, shouldDelete : ?Bool) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can leave channels");
    };

    let channelsSet = switch (persistentState.userChannels.get(caller)) {
      case (null) { Runtime.trap("User not in any channels") };
      case (?existing) { existing };
    };

    if (not channelsSet.contains(name)) {
      Runtime.trap("User not in channel");
    };

    switch (persistentState.channels.get(name)) {
      case (null) { Runtime.trap("Channel does not exist") };
      case (?channel) {
        switch (shouldDelete) {
          case (?true) {
            if (channel.creator != caller) {
              Runtime.trap("Unauthorized: Only channel creator can delete the channel");
            };
            persistentState.channels.remove(name);
            persistentState.messages.remove(name);
            for ((user, userChannels) in persistentState.userChannels.entries()) {
              userChannels.remove(name);
            };
            return;
          };
          case (_) {};
        };
      };
    };

    channelsSet.remove(name);

    let remainingMembers = getChannelMemberCount(name);
    if (remainingMembers == 0) {
      persistentState.channels.remove(name);
      persistentState.messages.remove(name);
    };
  };

  public shared ({ caller }) func sendMessage(channel : Text, content : Text, attachments : [Attachment]) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    if (not persistentState.channels.containsKey(channel)) {
      Runtime.trap("Channel does not exist");
    };

    let channelsSet = switch (persistentState.userChannels.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Must join channel before sending messages") };
      case (?existing) { existing };
    };

    if (not channelsSet.contains(channel)) {
      Runtime.trap("Unauthorized: Must join channel before sending messages");
    };

    let message : Message = {
      sender = caller;
      content;
      timestamp = Time.now();
      channel;
      attachments;
    };

    let channelMessages = switch (persistentState.messages.get(channel)) {
      case (null) { List.empty<Message>() };
      case (?existing) { existing };
    };

    channelMessages.add(message);
    persistentState.messages.add(channel, channelMessages);

    addUserXP(caller, 10);
    updateStatistics(0, 0, 1, 0);
  };

  public query ({ caller }) func getAccessibleChannels() : async [ChannelWithMembers] {
    let joinedChannelsSet = switch (persistentState.userChannels.get(caller)) {
      case (null) { Set.empty<Text>() };
      case (?existing) { existing };
    };

    let accessibleChannels = persistentState.channels.filter(
      func(_name, channel) {
        joinedChannelsSet.contains(channel.name);
      }
    ).values().toArray();

    let accessibleChannelsWithMembers = accessibleChannels.map(
      func(channel) {
        {
          channel with
          memberCount = getChannelMemberCount(channel.name);
        };
      }
    );

    accessibleChannelsWithMembers;
  };

  public query ({ caller }) func getChannelMessages(channel : Text) : async [Message] {
    if (not persistentState.channels.containsKey(channel)) {
      Runtime.trap("Channel does not exist");
    };

    let channelsSet = switch (persistentState.userChannels.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Not authorized to view this channel") };
      case (?existing) { existing };
    };

    if (not channelsSet.contains(channel)) {
      Runtime.trap("Unauthorized: Not authorized to view this channel");
    };

    switch (persistentState.messages.get(channel)) {
      case (null) { [] };
      case (?msgs) { msgs.toArray() };
    };
  };

  public query ({ caller }) func getUserChannels(user : Principal) : async [Text] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own channels");
    };

    switch (persistentState.userChannels.get(user)) {
      case (null) { [] };
      case (?channelsSet) { channelsSet.toArray() };
    };
  };

  public shared ({ caller }) func setUsername(username : Text) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can set usernames");
    };

    let profile : UserProfile = {
      username;
      joinedChannels = [];
      xp = 0;
      level = 0;
    };
    persistentState.userProfiles.add(caller, profile);
    updateStatistics(0, 1, 0, 0);
  };

  public query ({ caller }) func getUsername(user : Principal) : async ?Text {
    switch (persistentState.userProfiles.get(user)) {
      case (null) { null };
      case (?profile) { ?profile.username };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (isCallerGuest(caller)) {
      return null;
    };
    persistentState.userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    persistentState.userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not hasUserPermission(caller)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    persistentState.userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func setRandomJoinEnabled(channelName : Text, isEnabled : Bool) : async () {
    switch (persistentState.channels.get(channelName)) {
      case (null) { Runtime.trap("Channel does not exist") };
      case (?channel) {
        if (channel.creator != caller) {
          Runtime.trap("Unauthorized: Only channel creator may update this setting");
        };

        let newChannel : Channel = {
          channel with
          allowRandomJoin = isEnabled;
        };
        persistentState.channels.add(channelName, newChannel);
      };
    };
  };

  public query ({ caller }) func getRandomJoinEnabled(channelName : Text) : async Bool {
    if (not isUserInChannel(caller, channelName)) {
      Runtime.trap("Unauthorized: Must be a channel member to view settings");
    };

    switch (persistentState.channels.get(channelName)) {
      case (null) { Runtime.trap("Channel does not exist") };
      case (?channel) { channel.allowRandomJoin };
    };
  };

  public query ({ caller }) func isChannelAdmin(channelName : Text) : async Bool {
    if (not isUserInChannel(caller, channelName)) {
      Runtime.trap("Unauthorized: Must be a channel member to check admin status");
    };

    switch (persistentState.channels.get(channelName)) {
      case (null) { false };
      case (?channel) { channel.creator == caller };
    };
  };

  public shared ({ caller }) func setChannelMaxMembers(channelName : Text, maxMembers : ?Nat) : async () {
    switch (persistentState.channels.get(channelName)) {
      case (null) { Runtime.trap("Channel does not exist") };
      case (?channel) {
        if (channel.creator != caller) {
          Runtime.trap("Unauthorized: Only channel creator can update member limit");
        };

        if (maxMembers == ?0) {
          Runtime.trap("Invalid member limit, must be at least 1");
        };

        let currentMemberCount = getChannelMemberCount(channelName);
        if (maxMembers != null and currentMemberCount > (switch (maxMembers) { case (null) { 0 }; case (?m) { m } })) {
          Runtime.trap("Cannot set member limit lower than current member count");
        };

        let newChannel : Channel = {
          channel with
          maxMembers = maxMembers;
        };
        persistentState.channels.add(channelName, newChannel);
      };
    };
  };

  public query ({ caller }) func getChannelMemberLimit(channelName : Text) : async ?Nat {
    if (not isUserInChannel(caller, channelName)) {
      Runtime.trap("Unauthorized: Must be a channel member to view member limit");
    };

    switch (persistentState.channels.get(channelName)) {
      case (null) { null };
      case (?channel) { channel.maxMembers };
    };
  };

  public query ({ caller }) func verifyChannelAdmin(channelName : Text) : async Bool {
    if (not isUserInChannel(caller, channelName)) {
      Runtime.trap("Unauthorized: Must be a channel member to verify admin status");
    };

    switch (persistentState.channels.get(channelName)) {
      case (null) { false };
      case (?channel) { channel.creator == caller };
    };
  };

  public query ({ caller }) func getChannelDetails(channelName : Text) : async ?Channel {
    if (not isUserInChannel(caller, channelName)) {
      Runtime.trap("Unauthorized: Must be a channel member to view channel details");
    };

    persistentState.channels.get(channelName);
  };

  public query ({ caller }) func getUserXPAndLevel() : async (Nat, Nat) {
    if (isCallerGuest(caller)) {
      return (0, 0);
    };

    switch (persistentState.userProfiles.get(caller)) {
      case (null) { (0, 0) };
      case (?profile) { (profile.xp, profile.level) };
    };
  };

  public query ({ caller }) func getCallerUserLevelProgress() : async (Nat, Float) {
    if (isCallerGuest(caller)) {
      return (0, 0.0);
    };

    switch (persistentState.userProfiles.get(caller)) {
      case (null) { (0, 0.0) };
      case (?profile) {
        let lvl = calculateLevel(profile.xp);
        let progress = calculateProgress(profile.xp);
        (lvl, progress);
      };
    };
  };
};
