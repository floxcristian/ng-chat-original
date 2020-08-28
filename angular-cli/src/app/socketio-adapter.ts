import {
  ChatAdapter,
  User,
  Message,
  ParticipantResponse,
  Group,
  IChatGroupAdapter,
} from "ng-chat";
import { Observable, of } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { Socket } from "ng-socket-io";
import { Http, Response } from "@angular/http";

export class SocketIOAdapter extends ChatAdapter implements IChatGroupAdapter {
  private socket: Socket;
  private http: Http;
  private userId: string;

  constructor(userId: string, socket: Socket, http: Http) {
    super();
    this.socket = socket;
    this.http = http;
    this.userId = userId;

    this.InitializeSocketListerners();
  }

  listFriends(): Observable<ParticipantResponse[]> {
    return this.http
      .post("http://localhost:3000/listFriends", { userId: this.userId })
      .pipe(
        map((res: Response) => res.json()),
        catchError((error: any) =>
          Observable.throw(error.json().error || "Server error")
        )
      );
  }

  getMessageHistory(userId: any): Observable<Message[]> {
    return of([]);
  }

  sendMessage(message: Message): void {
    this.socket.emit("sendMessage", message);
  }

  groupCreated(group: Group): void {
    console.log("group created: ", group);

    this.listFriends().subscribe((response) => {
      this.onFriendsListChanged(response);
    });

    this.socket.emit("groupCreated", group);
  }

  public InitializeSocketListerners(): void {
    this.socket.on("messageReceived", (messageWrapper) => {
      console.log("messageReceived: ", messageWrapper);
      this.onMessageReceived(messageWrapper.user, messageWrapper.message);
    });

    this.socket.on(
      "friendsListChanged",
      (usersCollection: Array<ParticipantResponse>) => {
        console.log("friendsListChanged: ", usersCollection);
        // Handle the received message to ng-chat
        this.onFriendsListChanged(
          usersCollection.filter((x) => x.participant.id != this.userId)
        );
      }
    );
  }
}
