class GroupChat {
  allConnectedParticipants = []; // [ { participant, metadata } ]
  disconnectedParticipants = []; // [ { participant, metadata } ]
  allGroupParticipants = []; // { chattingTo }
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

  static connectedParticipants(currentUserId) {
    return filteredGroupParticipants(currentUserId).filter(
      (x) => x.participant.id != currentUserId
    );
  }

  SendMessage(message) {
    const sender = allConnectedParticipants.find(
      (x) => x.participant.id == message.fromId
    );

    // Si el emisor no esta en la lista de conectados
    if (sender != null) {
      const groupDestinatary = allGroupParticipants.filter(
        (x) => x.id == message.toId
      );

      if (groupDestinatary != null) {
        // Notificar a todos los usuarios excepto al emisor
        const usersInGroupToNotify = allConnectedParticipants
          .filter(
            (p) =>
              p.participant.id != sender.participant.id &&
              groupDestinatary.chattingTo.some((g) => g.id == p.participant.id)
          )
          .map((g) => g.participant.id);

        socket
          .to(usersInGroupToNotify)
          .emit("messageReceived", groupDestinatary, message);
      } else {
        socket
          .to(message.ToId)
          .emit("messageReceived", sender.participant, message);
      }
    }
  }
}
