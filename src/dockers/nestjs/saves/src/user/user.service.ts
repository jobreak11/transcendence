import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import * as path from 'path';
import * as fs from 'fs/promises'
import { SHARED_STORAGE_PATH, STORAGE_URL_PATH } from '../constant.js';
import { DRIZZLE } from '../drizzle/drizzle.module.js';
import type { DrizzleDB } from '../drizzle/types/drizzle.js';
import { users } from '../drizzle/schema/users.schema.js';
import { eq } from 'drizzle-orm';

@Injectable()
export class UserService {

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
  )
  {}

  async updateHashedRefreshToken(userId: string, hashedRefreshToken: string | null){

    const [updateUser] = await this.db
      .update(users)
      .set({hashedRefreshToken: hashedRefreshToken})
      .where(eq(users.id, userId))
      .returning({ id: users.id });


    if (!updateUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

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

  async findByEmail(email: string) {


    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    return user;

  }

  async findByTagId(tagId: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.tagId, tagId))
      .limit(1);

    return (user);
  }

  async findAll() {

    return await this.db.select().from(users);
  }

  async findOne(id: string) {

    const [user] = await this.db.select().from(users).where(eq(users.id, id))
    .limit(1);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

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

    return updatedUser;
  }


  async remove(id: string) {
    const [deletedUser] = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning({id: users.id});

    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return (
      {
        deleted: true,
        id: deletedUser.id
      }
    )
  }
}
