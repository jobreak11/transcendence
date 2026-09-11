import { Role } from "../enums/role.enum.ts";

export type CurrentUser = {
  id: string;
  role: Role;
}