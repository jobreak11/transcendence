import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto, UpdateUserResponseDto, updateUserSchema } from './dto/update-user.dto.js';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import * as path from 'path';
import * as fs from 'fs/promises'
import { SHARED_STORAGE_PATH, STORAGE_URL_PATH } from '../constant.js';
import { users, userSchema } from '../drizzle/schema/users/users.schema.js';
import { eq } from 'drizzle-orm';
import { UserDto } from '../drizzle/schema/users/user.dto.js';
import { TitleService } from './title/title.service.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { dbSchema } from '../drizzle/schema/schema.js';
import { user_profiles, userProfileSchema } from '../drizzle/schema/user_profiles/user_profiles.schema.js';
import z from 'zod';
import { UserRedisService } from '../redis/user-redis/user-redis.service.js';
import { UserAndProfileDto } from './dto/user-and-profile.dto.js';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import { UserCachingService } from '../redis/caching/user-caching/user-caching.service.js';

@Injectable()
export class UserService {

  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof dbSchema.dbRelations>,
    private readonly userRedisService: UserRedisService,
    private readonly userCachingService: UserCachingService,
    private readonly titleService: TitleService,
  )
  {}

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string | null): Promise<UserAndProfileDto>{

    try {
      const res = await this.db.transaction(async (tx): Promise<UserAndProfileDto> => {

        const [updateUser] = await tx
          .update(users)
          .set({hashedRefreshToken: hashedRefreshToken})
          .where(eq(users.id, userId))
          .returning();

        if (!updateUser) {
          tx.rollback();
          throw new Error(`user id ${userId} not found`)
        }

        const userProfile = await tx.query.user_profiles.findFirst({
          where: {
            userId: userId
          }
        })

        if (!userProfile) {
          throw new Error(`user id ${userId} not found`)
        }

        return {
          ...updateUser,
          user_profile: userProfile
        }

      })

      return res
    } catch (error: any) {
      throw new NotFoundException("user not found")
    }
  }

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
        throw new ConflictException(`This user is already exist`);
      }

      this.logger.error({
        message: "error from create()",
        error: {...error}
      })
      throw new InternalServerErrorException("unknown error");
    }
  }

  async findByEmail(email: string): Promise<UserAndProfileDto> {

    // find from redis first this will return the id of the user
    const cacheByUserEmailFound = await this.userCachingService.getCacheByEmail(email);
    if (cacheByUserEmailFound) {
      // the id of the user to find the 
        return cacheByUserEmailFound;
      }

    // cache by email not found
    const user = await this.db.query.users.findFirst({
      where: {
        email: email
      },
      with: {
        user_profile: true
      }
    });

    if (!user)
      throw new NotFoundException(`User ${email} not found`)

    await this.userCachingService.cachingUser(user);

    return user;
  }

  async findByTagId(tagId: string): Promise<UserAndProfileDto> {
    const cacheByTagIdFound = await this.userCachingService.getCacheByTagId(tagId);

    if (cacheByTagIdFound) {
      return cacheByTagIdFound
    }

    const user = await this.db.query.users.findFirst({
      where: {
        tagId: tagId
      },
      with: {
        user_profile: true
      }
    });

    if (!user)
      throw new NotFoundException(`User tagId ${tagId} not found.`);

    this.userCachingService.cachingUser(user);

    return (user);
  }

  async findAll() {

    return await this.db.select().from(users);
  }

  async findOne(id: string): Promise<UserAndProfileDto> {

    const foundCache = await this.userCachingService.getCacheById(id);

    if (foundCache) {
      return foundCache
    }

    //const [user] = await this.db.select().from(users).where(eq(users.id, id))
    //.limit(1);

    const user = await this.db.query.users.findFirst({
      where: {
        id: id
      },
      with: {
        user_profile: true
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userCachingService.cachingUser(user);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {


    // strip thrw updateUserDto
    const userProfile = userProfileSchema.update.strip().safeParse(updateUserDto.user_profile);
    const userData = userSchema.update.strip().safeParse(updateUserDto);

    if (!userProfile.success || !userData.success) {
      throw new BadRequestException({
        message: "updateDto validation failed",
        userProfileError: userProfile.error ? z.treeifyError(userProfile.error)  : null,
        userDataError: userData.error ? z.treeifyError(userData.error)  : null
      })
    }

    //const checkResult = updateUserSchema.safeParse(updateUserDto);

    //if (!checkResult.success) {
    //  throw new BadRequestException({
    //    message: "updateDto validation failed",
    //    error: z.treeifyError(checkResult.error)
    //  })
    //}

    let data = userData.data;

    if (data.password) {
      data.password = await argon2.hash(data.password);
    }

    try {

      const result = await this.db.transaction(async (tx): Promise<UserAndProfileDto> => {


        const [userDataUpdateResult] = await tx
          .update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning();

        if (!userDataUpdateResult) {
          tx.rollback();
          throw new Error(`user id ${id} not found`);
        }

        const [userProfileUpdateResult] = await tx
          .update(user_profiles)
          .set(userProfile.data)
          .where(eq(user_profiles.userId, id))
          .returning();

        if (!userProfileUpdateResult) {
          tx.rollback();
          throw new Error(`user id ${id} not found`);
        }

        return {
          ...userDataUpdateResult,
          user_profile: userProfileUpdateResult
        }

      })

      await this.userCachingService.cachingUser(result);
      return result;
    } catch (error: any) {

      if (error instanceof Error) {
        throw new NotFoundException("user id not found");
      }

      if (error?.cause?.code) {
        // Postgresql error

        // unique primary key violation
        if (error?.cause?.code === '23505') {
          throw new ConflictException(`This user is already exist`);
        }

        // foriegn key violation
        if (error?.cause?.code === '23503') {
          throw new ForbiddenException("the title id is invalid")
        }

      }

      // something else shuld throw internal error and log 
      this.logger.error({
        message: "error from update()",
        error: error
      })
       
      throw new InternalServerErrorException("unknown error");
    }
  }

  async uploadProfilePic(id: string, fileBuffer: Buffer): Promise<UserAndProfileDto> {

    await this.findOne(id);

    const uploadDir = path.join(SHARED_STORAGE_PATH, String(id));
    const destinationPath = path.join(uploadDir, 'profile.jpg');

    await fs.mkdir(uploadDir, {recursive: true});
    await fs.writeFile(destinationPath, fileBuffer);

    const newAvatarURL = path.join(STORAGE_URL_PATH, `${id}/profile.jpg`);

    return this.update(id, {user_profile: {avatarUrl: newAvatarURL}})
    
  }


  async remove(id: string): Promise<UserDto> {
    const [deletedUser] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userCachingService.cacheDeleteUser(deletedUser.id);

    return deletedUser
  }
}
