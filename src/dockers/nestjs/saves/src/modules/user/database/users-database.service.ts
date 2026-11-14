import { ConflictException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { DRIZZLE } from "../../../infrastructure/drizzle/drizzle.module.js";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import { dbSchema } from "../../../infrastructure/drizzle/schema/schema.js";
import { createOne } from "drizzle-orm/_relations";
import { CreateUserDto } from "../dto/create-user.dto.js";
import * as argon2 from 'argon2'
import { users } from "../../../infrastructure/drizzle/schema/users/users.schema.js";
import { user_profiles } from "../../../infrastructure/drizzle/schema/user_profiles/user_profiles.schema.js";
import { errorWithCode } from "../../../utility/errorWithCode.js";
import { logError } from "../../../utility/logError.js";
import { UserAndProfileDto } from "../dto/user-and-profile.dto.js";

@Injectable()
export class UsersDatabaseService {

  private readonly logger = new Logger(UsersDatabaseService.name);

  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof dbSchema.dbRelations>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    
    const hashedPassword = await argon2.hash(createUserDto.password);
    const {email, avatarUrl, displayName} = createUserDto;

    try {
      const result = await this.db.transaction(async (tx) => {
        const [newUser] = await tx.insert(users)
          .values({
            email: email,
            password: hashedPassword
          })
          .returning();
        
        const [newProfile] = await tx.insert(user_profiles)
          .values({
            userId: newUser.id,
            displayName: displayName,
            avatarUrl: avatarUrl,
          })
          .returning();

        return newUser
      })

      return result;
    } catch (error: any) {
      if (error?.cause?.code === '23505') {
        throw errorWithCode(
          HttpStatus.CONFLICT,
          "This user is already exist"
        );
      }

      this.logger.error({
        message: "error from create()",
        error: {...error}
      })
      throw logError(
        this.logger,
        "error from create()",
        "unknown error",
        HttpStatus.INTERNAL_SERVER_ERROR,
        error
      )
    }
  }

  // async findByEmail(email: string): Promise<UserAndProfileDto> {

  //   // find from redis first this will return the id of the user
  //   const cacheByUserEmailFound = await this.userCachingService.getCacheByEmail(email);
  //   if (cacheByUserEmailFound) {
  //     // the id of the user to find the 
  //       return cacheByUserEmailFound;
  //     }

  //   // cache by email not found
  //   const user = await this.db.query.users.findFirst({
  //     where: {
  //       email: email
  //     },
  //     with: {
  //       user_profile: true
  //     }
  //   });

  //   if (!user)
  //     throw new NotFoundException(`User ${email} not found`)

  //   await this.userCachingService.cachingUser(user);

  //   return user;
  // }

}