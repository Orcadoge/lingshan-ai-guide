// apps/api/src/modules/digital-human/digital-human.module.ts
import { Module } from '@nestjs/common';
import { DigitalHumanController, DigitalHumanAdminController } from './digital-human.controller';
import { DigitalHumanService } from './digital-human.service';
import { DidClientService } from './did-client.service';

@Module({
  controllers: [DigitalHumanController, DigitalHumanAdminController],
  providers: [DigitalHumanService, DidClientService],
  exports: [DigitalHumanService],
})
export class DigitalHumanModule {}
