import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { AppService } from './app.service';
import { FileOutputService } from './file-output/file-output.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService, FileOutputService],
})
export class AppModule {}
