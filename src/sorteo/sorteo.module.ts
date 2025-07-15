import { Module } from '@nestjs/common';
import { Sorteo } from './entities/sorteo.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SorteosService } from './services/sorteo.service';
import { SorteosResolver } from './resolvers/sorteo.resolver';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sorteo]), UtilsModule],
  providers: [SorteosService, SorteosResolver],
})
export class SorteosModule {}
