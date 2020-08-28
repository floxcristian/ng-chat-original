class GroupChat {
  allConnectedParticipants = []; // [ { participant, metadata } ]
  disconnectedParticipants = []; //
  allGroupParticipants = []; //
  participantsConnectionLock = {}; //

  static filteredGroupParticipants(currentUserId) {
    return allConnectedParticipants.filter(
      (p) =>
        p.participant.participantType == 0 ||
        allGroupParticipants.some(
          (g) =>
            g.id == p.participant.id &&
            g.chattingTo.some((u) => u.id == currentUserId)
        )
    );
  }

  connectedParticipants(currentUserId) {
    return filteredGroupParticipants(currentUserId).filter(
      (x) => x.participant.id != currentUserId
    );
  }

  join(userName) {
    /*lock (ParticipantsConnectionLock)
        {
            const newParticipant = {
                participant: {
                    displayName: userName,
                    id: socket.id
                },
                metadata: {
                    totalUnreadMessages: 0
                }
            }
            AllConnectedParticipants.push(newParticipant);
            

            // This will be used as the user's unique ID to be used on ng-chat as the connected user.
            // You should most likely use another ID on your application
            Clients.Caller.SendAsync("generatedUserId", Context.ConnectionId);
            socket.emit("generatedUserId", socket.id)

            Clients.All.SendAsync("friendsListChanged", AllConnectedParticipants);
        }*/
  }

  GroupCreated(group) {
    allGroupParticipants.push(group);

    // Pushing the current user to the "chatting to" list to keep track of who's created the group as well.
    // In your application you'll probably want a more sofisticated group persistency and management

    const newChatParticipant = { id: socket.id };
    group.chattingTo.push(newChatParticipant);

    const newParticipant = {
      participant: group,
      metadata: { TotalUnreadMessages: 0 },
    };
    allConnectedParticipants.push(newParticipant);

    //Clients.All.SendAsync("friendsListChanged", AllConnectedParticipants);
  }
}
