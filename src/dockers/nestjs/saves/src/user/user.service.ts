import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {

  constructor(@InjectRepository(User) private UserRepo: Repository<User>)
  {}

  async create(createUserDto: CreateUserDto) {
    
    // need to check if same email must not creatable
    const foundUser = await this.findByEmail(createUserDto.email);
    if (foundUser)
      throw new ForbiddenException(`cannot create new user with email ${createUserDto.email} already exists!`)

    const user = await this.UserRepo.create(createUserDto)
    return await this.UserRepo.save(user);
    return 'This action adds a new user';
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
        email: true,
        createdAt: true,
        avatarUrl: true
      }
    })

  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
