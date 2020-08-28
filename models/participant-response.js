const ParticipantResponse = {
  participant: {
    participantType, // User = 0, Group = 1
    id, // string
    status, // int
    avatar, // string
    displayName,
  },
  metadata: {
    TotalUnreadMessages,
  },
};
