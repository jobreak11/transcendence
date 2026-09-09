import { Module } from "@nestjs/common"
import { MyGateway } from "./gateway.js";

@Module({
  providers: [MyGateway],
})
export class GatewayModule {

}