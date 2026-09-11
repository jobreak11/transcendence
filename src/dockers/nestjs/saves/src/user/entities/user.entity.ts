import { BeforeInsert, Column, CreateDateColumn, Entity, Exclusion, Generated, PrimaryGeneratedColumn } from "typeorm";
import { Role } from "../../auth/enums/role.enum.js";
import * as argon2 from 'argon2'
import { ColumnMetadata } from "typeorm/metadata/ColumnMetadata.js";
import { Exclude } from "class-transformer";

/*

  NOTE; should apply new name convention to
  all tables and columns

  '_' = underscroll

  [linked_table_name]_[columm_name]

  naming for Column should be in camelCase format.
  First letter of table should be uppercase.
  Tables' name should(recommend) append with 's'.

  For Example: 
  
  We have table name: Users

  in another table should be

  user_<column_name>
*/

@Entity()
export class User {
  @PrimaryGeneratedColumn({
  })
  id: number;

  //@Column({unique: true})
  //// 260901-12341
  //publicId: string;

  @Generated()
  @Column({ type: 'uuid' , unique: true })
  publicId: string

  @Column({ unique: true })
  tagId: string

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

  @Column({
    nullable: true,
    type: "varchar",
    length: 15
    
  })
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
