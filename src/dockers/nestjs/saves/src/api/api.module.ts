import { Module } from "@nestjs/common";
import { WebsocketModule } from "./websocket/websocket.module.js";
import { InternalModule } from "./internal/internal.module.js";
import { PublicModule } from "./public/public.module.js";

@Module({
  imports: [
    WebsocketModule,
    InternalModule,
    PublicModule
  ]
})
export class ApiModule {

}