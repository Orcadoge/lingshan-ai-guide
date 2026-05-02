import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers['authorization'];

    if (!header || !header.startsWith('Basic ')) {
      throw new UnauthorizedException('后台接口需要 Basic Auth');
    }

    const raw = Buffer.from(header.replace('Basic ', ''), 'base64').toString(
      'utf8',
    );
    const [username, password] = raw.split(':');
    const expectedUser = this.configService.get('ADMIN_USERNAME');
    const expectedPassword = this.configService.get('ADMIN_PASSWORD');

    if (username !== expectedUser || password !== expectedPassword) {
      throw new UnauthorizedException('后台账号或密码错误');
    }

    return true;
  }
}
