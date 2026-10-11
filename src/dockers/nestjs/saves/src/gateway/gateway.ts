import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer, ConnectedSocket } from "@nestjs/websockets";
import { Public } from "../auth/decorators/public.decorators.js";
import { Server, Socket } from 'socket.io'
import { OnModuleInit } from "@nestjs/common";
import { createClient, RedisClientType } from "redis";
import { shuffleDeck } from "../game/tools/shuffle.js";

@Public()
@WebSocketGateway({
  cors: {
    origin: '*',
  }
})
export class MyGateway implements OnModuleInit {

  @WebSocketServer()
  server: Server;

  private redisClient: RedisClientType;

  async onModuleInit() {
    this.redisClient = createClient({ url: "redis://localhost:2345" });
    await this.redisClient.connect();

    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    })
  }

  @SubscribeMessage('join game')
  async handleJoinGame( 
    @MessageBody() data: { tableId: string }, 
    @ConnectedSocket() socket: Socket) {
      const roomName = `table:${data.tableId}`;
      socket.join(roomName);

      const rawState = await this.redisClient.get(roomName);
      if (rawState) {
        socket.emit("state-update", JSON.parse(rawState));
      }
  }

  @SubscribeMessage('shuffle-deal')
  async handleShuffleAndDeal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableId: string },
  ) {
    const tableId = data.tableId || '1';
    const deck = shuffleDeck();

    const playerHands: Record<string, string[]> = {};
    let deckIndex = 0;
    let seatCounts = 8;

    for (let seatNum = 1; seatNum <= seatCounts; seatNum++) {
      playerHands[`seat${seatNum}`] = [deck[deckIndex], deck[deckIndex + seatCounts]];
      deckIndex += 1;
    }

    const communityCards = deck.slice(deckIndex, deckIndex + 5);

    const gameState = {
      tableId,
      playerHands,
      communityCards,
      updatedAt: Date.now(),
    };

    await this.redisClient.set(`table:${tableId}`, JSON.stringify(gameState));

    this.server.to(tableId).emit('state-update', gameState);
  }


  
  // @SubscribeMessage("player action")
  // async handlePlayerAction(
  //   @MessageBody() data: { tableId: string; action: string; amount?: number },
  //   @ConnectedSocket() socket: Socket) {
  //     const roomName = `table:${data.tableId}`;
  //     const rawState = await this.redisClient.get(roomName);
      
  //     if (!rawState) 
  //       return;
      
  //     let state = JSON.parse(rawState);
      
  //     state.lastAction = { playerId: socket.id, type: data.action };
      
  //     await this.redisClient.set(roomName, JSON.stringify(state));
      
  //     this.server.to(roomName).emit("state-update", state);
  // }
}
