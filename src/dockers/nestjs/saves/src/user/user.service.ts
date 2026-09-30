import { ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import * as path from 'path';
import * as fs from 'fs/promises'
import { CACHING_USER_SERVICE_EXPIRE_TIME, SHARED_STORAGE_PATH, STORAGE_URL_PATH } from '../constant.js';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type { DrizzleDB } from '../drizzle/types/drizzle.js';
import { users } from '../drizzle/schema/users.schema.js';
import { eq } from 'drizzle-orm';
import { REDIS_CLIENT } from '../redis/redis.provider.js';
import type { RedisClient } from '../redis/redis.provider.js';
import { UserDto } from './dto/user.dto.js';

@Injectable()
export class UserService {

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient
  )
  {}

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string | null): Promise<UserDto>{

    const [updateUser] = await this.db
      .update(users)
      .set({hashedRefreshToken: hashedRefreshToken})
      .where(eq(users.id, userId))
      .returning();

    if (!updateUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    await this.cachingUser(updateUser);
    return updateUser;
  }

  async create(createUserDto: CreateUserDto) {
    

    const hashedPassword = await argon2.hash(createUserDto.password);

    try {
      const [newUser] = await this.db.insert(users)
        .values({
          ...createUserDto,
          password: hashedPassword
        })
        .returning();

      return newUser;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`This user is already exist`);
      }
      throw error
    }
  }

  cacheDeleteUser(user: UserDto) {
    return this.redis.del(
      `cache:user:id:${user.id}`,
      `cache:user:email:${user.email}`,
      `cache:user:tag_id:${user.tagId}`,
    )
  }

  cachingUser(user: UserDto) {
    const stringCacheData = JSON.stringify(user);
    //await this.redis.pipeline()
    //  .set(`cache:user:id:${id}`, stringCacheData, "EX", CACHING_USER_SERVICE_EXPIRE_TIME)
    //  .set(`cache:user:email:${user.email}`, id, "EX", CACHING_USER_SERVICE_EXPIRE_TIME - 1)
    //  .exec()

    // <namespace>:...:${id}
    return this.redis.msetex(3, 
      `cache:user:id:${user.id}`, stringCacheData,
      `cache:user:email:${user.email}`, user.id, 
      `cache:user:tag_id:${user.tagId}`, user.id,
      "EX", CACHING_USER_SERVICE_EXPIRE_TIME)
  }

  async findByEmail(email: string): Promise<UserDto> {

    // find from redis first this will return the id of the user
    const cacheByUserEmailFound = await this.redis.getex(`cache:user:email:${email}`, "EX", CACHING_USER_SERVICE_EXPIRE_TIME);
    if (cacheByUserEmailFound) {
      // the id of the user to find the 
      return await this.findOne(cacheByUserEmailFound);
    }

    // cache by email not found

    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user)
      throw new NotFoundException(`User ${email} not found`)

    await this.cachingUser(user);

    return user;



    return user;

  }

  async findByTagId(tagId: string): Promise<UserDto> {
    const cacheByTagIdFound = await this.redis.get(`cache:user:tag_id:${tagId}`)

    if (cacheByTagIdFound) {
      return await this.findOne(cacheByTagIdFound)
    }

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.tagId, tagId))
      .limit(1);

    if (!user)
      throw new NotFoundException(`User tagId ${tagId} not found.`);

    this.cachingUser(user);

    return (user);
  }

  async findAll() {

    return await this.db.select().from(users);
  }

  async findOne(id: string): Promise<UserDto> {

    try {

      const cacheData = await this.redis.getex(`cache:user:id:${id}`, 'EX', CACHING_USER_SERVICE_EXPIRE_TIME);
      if (cacheData) {
        return (JSON.parse(cacheData) as UserDto);
      }
    } catch (err) {
      throw new InternalServerErrorException("unknown error from redis");
    }

    const [user] = await this.db.select().from(users).where(eq(users.id, id))
    .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.cachingUser(user);

    return user;

  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    try {
      const [updatedUser] = await this.db
        .update(users)
        .set(updateUserDto)
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID  ${id} not found`);
      }

      await this.cachingUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException(`This user is already exist`);
      }
      throw error
    }
  }

  async uploadProfilePic(id: string, fileBuffer: Buffer) {

    await this.findOne(id);

    const uploadDir = path.join(SHARED_STORAGE_PATH, String(id));
    const destinationPath = path.join(uploadDir, 'profile.jpg');

    await fs.mkdir(uploadDir, {recursive: true});
    await fs.writeFile(destinationPath, fileBuffer);

    const newAvatarURL = path.join(STORAGE_URL_PATH, `${id}/profile.jpg`);

    const [updatedUser] = await this.db
      .update(users)
      .set({avatarUrl: newAvatarURL})
      .where(eq(users.id, id))
      .returning();
    
    this.cachingUser(updatedUser);

    return updatedUser;
  }


  async remove(id: string) {
    const [deletedUser] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    this.cacheDeleteUser(deletedUser);

    return (
      {
        deleted: true,
        id: deletedUser.id
      }
    )
  }
}
