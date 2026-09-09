import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import * as argon2 from 'argon2';
import * as path from 'path';
import * as fs from 'fs/promises'
import { SHARED_STORAGE_PATH, STORAGE_URL_PATH } from '../constant.js';

@Injectable()
export class UserService {

  constructor(@InjectRepository(User) private UserRepo: Repository<User>)
  {}

  async updateHashedRefreshToken(userId: number, hashedRefreshToken: string | null){
    return await this.UserRepo.update({id: userId}, {hashedRefreshToken});
  }

  async create(createUserDto: CreateUserDto) {
    
    // need to check if same email must not creatable
    const foundUser = await this.findByEmail(createUserDto.email);
    if (foundUser)
      throw new ConflictException(`cannot create new user with email ${createUserDto.email} already exists!`)

    const user = await this.UserRepo.create(createUserDto)
    return await this.UserRepo.save(user);
  }

  async findByEmail(email: string) {
    return await this.UserRepo.findOne({
      where: {
        email,
      }
    });
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {

    return this.UserRepo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        createdAt: true,
        avatarUrl: true,
        displayName: true,
        //hashedRefreshToken: true,
        role: true
      }
    })

  }

  async update(id: number, updateUserDto: UpdateUserDto) {

    if (updateUserDto.password) {
      updateUserDto.password = await argon2.hash(updateUserDto.password);
    }

    return this.UserRepo.update({id}, updateUserDto);
  }

  async uploadProfilePic(id: number, file: Express.Multer.File) {

    const uploadDir = path.join(SHARED_STORAGE_PATH, String(id));
    const destinationPath = path.join(uploadDir, 'profile.jpg');

    await fs.mkdir(uploadDir, {recursive: true});
    await fs.writeFile(destinationPath, file.buffer);

    const newAvatarURL = path.join(STORAGE_URL_PATH, `${id}/profile.jpg`);
    await this.update(id, {avatarUrl: newAvatarURL});
    return {
      success: true,
      avatarUrl: newAvatarURL,
    };
  }


  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
