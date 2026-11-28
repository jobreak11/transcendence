import z from "zod";
import { LobbyCreate } from "../redis/schemas/lobby-create.redis.schema.js";

const schema = LobbyCreate.schema.input.omit({details: true})

export const LobbyUserCreateSchema = schema;
