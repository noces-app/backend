import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return {
      message: 'Welcome to Noces API!',
      timestamp: new Date().toISOString(),
      service: 'noces-api',
    };
  }
}
