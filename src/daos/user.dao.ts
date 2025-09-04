import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Role } from 'src/base/constants';
import { UpdateUserDto } from 'src/dtos/index.dto';
import { UserEntity } from 'src/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class UserDao {
  private _db: Repository<UserEntity>;

  constructor(private dataSource: DataSource) {
    this._db = this.dataSource.getRepository(UserEntity);
  }

  getByEmail = async (email: string) => {
    if (!email) return null;
    let where;
    where = {
      email: email,
    };
    if (!isNaN(parseInt(email))) {
      where = {
        id: +email,
      };
    }
    const res = await this._db.findOne({
      where: [
        where,
        {
          organizationRegisterNumber: email,
        },
      ],
    });
    return res;
  };
}
