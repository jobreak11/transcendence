import { ConflictException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
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
      .returning();

    return updateUser;

    // return await this.UserRepo.update({id: userId}, {hashedRefreshToken});
  }

  async create(createUserDto: CreateUserDto) {
    

    // need to check if same email must not creatable
    const foundUser = await this.findByEmail(createUserDto.email);
    if (foundUser)
      throw new ConflictException(`cannot create new user with email ${createUserDto.email} already exists!`)

    const hashedPassword = await argon2.hash(createUserDto.password);
    const [newUser] = await this.db.insert(users)
      .values({
        ...createUserDto,
        password: hashedPassword
      })
      .returning();

    // const user = await this.UserRepo.create(createUserDto)
    // return await this.UserRepo.save(user);
    return newUser;
  }

  async findByEmail(email: string) {


    const [user] = await this.db.select().from(users).where(eq(users.email, email)).limit(1);

    return user;

    // return await this.UserRepo.findOne({
    //   where: {
    //     email,
    //   }
    // });
  }

  async findAll() {

    return await this.db.select().from(users);
  }

  async findOne(id: string) {

    const [user] = await this.db.select().from(users).where(eq(users.id, id))
    .limit(1);

    return user;

    // return this.UserRepo.findOne({
    //   where: { id },
    //   select: {
    //     id: true,
    //     email: true,
    //     createdAt: true,
    //     avatarUrl: true,
    //     displayName: true,
    //     //hashedRefreshToken: true,
    //     role: true
    //   }
    // })

  }

  async update(id: string, updateUserDto: UpdateUserDto) {

    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    const [updatedUser] = await this.db
      .update(users)
      .set(updateUserDto)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;

    // return this.UserRepo.update({id}, updateUserDto);
  }

  async uploadProfilePic(id: string, fileBuffer: Buffer) {

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

    return updatedUser


    // await this.update(id, {avatarUrl: newAvatarURL});
    // return {
    //   success: true,
    //   avatarUrl: newAvatarURL,
    // };
  }


  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
