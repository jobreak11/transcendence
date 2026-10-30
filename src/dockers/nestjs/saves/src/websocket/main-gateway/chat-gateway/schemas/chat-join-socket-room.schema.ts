import z, { ZodXID } from "zod";

export namespace ChatJoinSocketRoom {
  export const schema = z.object({
    chatRoomId: z.uuid()
  });

  export type Dto = z.infer<typeof schema>;
}
