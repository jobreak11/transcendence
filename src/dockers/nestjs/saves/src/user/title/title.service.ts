import { ConflictException, ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../../drizzle/drizzle.module.js';
import { REDIS_CLIENT } from '../../redis/redis.provider.js';
import type { DrizzleDB } from '../../drizzle/types/drizzle.js';
import type { RedisClient } from '../../redis/redis.provider.js';
import { titles } from '../../drizzle/schema/titles.schema.js';
import { user_titles } from '../../drizzle/schema/user_titles.schema.js';
import { and, asc, desc, eq } from 'drizzle-orm';
import { CreateNewTitleZodDto, GetUserTitleDto, TitleDto, UpdateTitleZodDto, UserTitleDto } from './title.dto.js';
import { CACHING_TITLE_SERVICE1_EXPIRE_TIME } from '../../constant.js';
import { title } from 'process';

@Injectable()
export class TitleService {

  private readonly logger = new Logger(TitleService.name);

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    @Inject(REDIS_CLIENT) private readonly redis: RedisClient
  ) { }

  
  // Get all available titles from title tables
  async getAllTitles(): Promise<TitleDto[]> {

    try {

      const allTitles = await this.db
        .select()
        .from(titles)
        .orderBy(
          asc(titles.name),
          desc(titles.createdAt)
        );

      return allTitles;
    } catch (error: any) {
      this.logger.error({
        message: "error from getAllTitles",
        error: error?.message
      });

      throw new InternalServerErrorException(`unknown error fetching data`);
    }
  }

  // create new title
  async createNewTitle(createNewTitle: CreateNewTitleZodDto): Promise<TitleDto> {

    try {

      const [res] = await this.db
        .insert(titles)
        .values({
          name: createNewTitle.name,
          description: createNewTitle.description,
          createdAt: createNewTitle.createdAt
        })
        .returning();

      if (!res) {
        this.logger.error({
          message: "Doesn't throw error, but doesn't returning the data back"
        });
        throw new InternalServerErrorException("Unknown Error When Inserting data to database");
      }

      return res;
    } catch (error: any) {

      // Postgresql Error Code
      if (error?.code) {
        if (error?.code === '23505') {
          throw new ConflictException(`The title name is already exist on the database. All title name must be unique.`);
        }
        else {
          this.logger.error({
            message: "error from createNewTitle",
            error: `POSTGRESQL ERROR CODE: ${error?.code ?? "UNKNOWN"}`
          })
          throw new InternalServerErrorException("Unknown Database Error");

        }
      }

      this.logger.error({
        message: "error from createNewTitle",
        error: error?.message
      });

      throw new InternalServerErrorException("unknown error");
    }
    // insert into data base
  }

  // remove the specific title from to database
  // should you need to know the title id
  async removeTitle(titleId: string): Promise<TitleDto> {
    try {

      const [returnDbRes] = await Promise.allSettled([
        this.db
          .delete(titles)
          .where(eq(titles.id, titleId))
          .returning()
      ]);


      if (returnDbRes.status === "fulfilled") {
        return (returnDbRes.value[0]);
      }
      else {
        this.logger.error({
          message: "From removeTitle",
          error: returnDbRes.reason
        });

        throw new InternalServerErrorException("unknown error from database");
      }

    } catch (error: any) {

      this.logger.error({
        message: "Error from removeTitle",
        error: error
      })

      throw new InternalServerErrorException("unknown error")
    }
  }

  async updateTitle(titleId: string, updateTitle: UpdateTitleZodDto) {

    try {

      const [res] = await this.db
        .update(titles)
        .set({
          name: updateTitle.name,
          description: updateTitle.description,
          createdAt: updateTitle.createdAt
        })
        .where(eq(titles.id, titleId))
        .returning();

      if (!res) {
        throw new NotFoundException("the title not found");
      }

      return res;
    } catch (error: any) {

      if (error?.code) {
        // Postgresql error code

         if (error.code === '23505')
          throw new ConflictException("name must be unique");
      }

      this.logger.error({
        message: "error from updateTitle()",
        error: error
      })

      throw new InternalServerErrorException("unknown error");
    }
  }

  // get all the this user achieve
  async getAllUserTitles(userId: string): Promise<GetUserTitleDto[]> {

    try {

      const res = await this.db
        .select({
          titleId:  user_titles.titleId,
          name: titles.name,
          description: titles.description,
          unlockedAt: user_titles.unlockedAt,
        })
        .from(titles)
        .innerJoin(
          user_titles,
          eq(titles.id, user_titles.titleId)
        )
        .where(
          eq(user_titles.userId, userId)
        )
        .orderBy(
          desc(user_titles.unlockedAt),
          asc(titles.name)
        );

        return res;
    } catch (error: any) {

      this.logger.error({
        message: "error from getAllTitles",
        error: error
      });

      throw new InternalServerErrorException(`unknown error fetching data`);
    }
  }

  // find one title by id
  async findOne(titleId: string): Promise<TitleDto> {

    try {
      const [res] = await this.db
        .select()
        .from(titles)
        .where(
          eq(titles.id, titleId)
        )
        .limit(1);

      if (res) {
        return  res;
      }
      
      throw new NotFoundException(`title id:${titleId} not found`);
    } catch (error: any) {
      this.logger.error({
        message: "error from findOne()",
        error: error
      });
      throw new InternalServerErrorException("unknow error");
    }
  }

  async findByName(titleName: string): Promise<TitleDto> {
    try {
      const [res] = await this.db
        .select()
        .from(titles)
        .where(
          eq(titles.name, titleName)
        )
        .limit(1);

      if (res) {
        return  res;
      }
      
      throw new NotFoundException(`title [${titleName}] not found`);
    } catch (error: any) {
      this.logger.error({
        message: "error from findOne()",
        error: error
      });
      throw new InternalServerErrorException("unknow error");
    }
  }

  // also check whether user have access to that titlte
  async findByUserTitle(userId: string, titleId: string): Promise<GetUserTitleDto> {

    try {

      const [res] = await this.db
        .select({
          titleId: titles.id,
          name: titles.name,
          description: titles.description,
          unlockedAt: user_titles.unlockedAt
        })
        .from(user_titles)
        .innerJoin(titles, eq(titles.id, user_titles.titleId))
        .where(
          and(
            eq(user_titles.userId, userId),
            eq(user_titles.titleId, titleId)
          )
        )
        .limit(1);

      if (!res) {
        throw new NotFoundException("user id or title name not found / or user don't beong to that title");
      }

      return res
    } catch (error: any) {
      this.logger.error({
        message: "error from findByUserTitle",
        error: error
      })

      throw new InternalServerErrorException("unknown error");
    }

  }

  // give a title to user
  async giveUserTitle(userId: string, titleId: string): Promise<UserTitleDto> {

    try {

      const [res] = await this.db
        .insert(user_titles)
        .values({
          titleId: titleId,
          userId: userId,
        })
        .returning();

      if (!res) {
        throw new InternalServerErrorException("Inserting failed");
      }

      return res;

    } catch (error: any) {

      // check if the postgresql error
      if (error?.code) {

        if (error.code === '23505') {
          // 23505 is unique violation of the primary key
          throw new ConflictException(`The user ${userId} id already have this title`);
        } else if (error.code === '23503') {
          // 23503 is foreign key violation, meaning that the parent might not exist
          throw new ForbiddenException(`the user or title id is not existed`);
        }
      }

      this.logger.error({
        message: "error From giveUserTitle",
        error: error
      });

      throw new InternalServerErrorException("unknown error");
    }
  }

  async revokeTitleFromUser(userId: string, titleId: string) {
    // remove title of that target user
    try {
      const [res] = await this.db
        .delete(user_titles)
        .where(
          and(
            eq(user_titles.userId, userId),
            eq(user_titles.titleId, titleId),
          ),
        )
        .returning();

      if (!res) {
        throw new NotFoundException("user don't have that target title id/ or userid is not found")
      }

      return res
    } catch (error: any) {

      // simple delete wont throw any error in normal circumstance

      //if (error?.code) {
      //  // check if it is postgres error code

      //}

      this.logger.error({
        message: "error from revokeTitleFromUser",
        error: error
      })

      throw new InternalServerErrorException("unknown error");
    }
  }
}
