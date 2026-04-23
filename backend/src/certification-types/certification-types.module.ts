import { Module } from '@nestjs/common';
import { CertificationTypesController } from './certification-types.controller';
import { CertificationTypesService } from './certification-types.service';

@Module({
  controllers: [CertificationTypesController],
  providers: [CertificationTypesService],
})
export class CertificationTypesModule {}
