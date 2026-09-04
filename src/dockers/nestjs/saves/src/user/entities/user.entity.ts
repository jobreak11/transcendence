import { BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../../auth/enums/role.enum.js";
import * as argon2 from 'argon2'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role

  // we want a way to revoking the refresh token from the user
  // first we need to store it in the database 
  @Column({nullable: true,
    type: 'text'
  })
  hashedRefreshToken: string | null

  @Column({nullable: true})
  displayName: string;

  @Column({nullable: true})
  avatarUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await argon2.hash(this.password);
  }
}
