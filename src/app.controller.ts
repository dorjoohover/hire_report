import {
  Controller,
  Get,
  Param,
  Request,
  Response as NestResponse,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ApiParam } from '@nestjs/swagger';
import type { Response as ExpressRes, Response } from 'express';
import * as mime from 'mime-types';
import { FileService } from './file.service';
import { createReadStream } from 'fs';
@Controller()
export class AppController {
  constructor(
    private service: AppService,
    private fileService: FileService,
  ) {}

  @Get('test/:code')
  @ApiParam({ name: 'code' })
  async requestPdf(
    @Param('code') code: string,
    @Request() { user },
    @NestResponse() res: ExpressRes,
  ) {
    const role = user?.['role'];
    const filename = `report-${code}.pdf`;

    // PDFKit.PDFDocument үүсгэнэ
    const doc = await this.service.getPdf(+code, role);

    // ↓↓↓ заавал pipe-с ӨМНӨ тавина
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-store');

    // Шууд хэрэглэгч рүү урсгана
    doc.pipe(res);
    doc.end();
  }
  @Get('/file/:file')
  @ApiParam({ name: 'file' })
  async getFile(@Param('file') filename: string) {
    return await this.fileService.getFile(filename);
  }
  @Get('/calculate/:code')
  @ApiParam({ name: 'code' })
  async calculate(@Param('code') code: string) {
    return await this.service.calculateExamById(+code);
  }
  @Get('core/:code')
  @ApiParam({ name: 'code' })
  async getReport(@Param('code') code: string, @Res() res: Response) {
    try {
      console.log(code);
      const filename = `report-${code}.pdf`;

      // Локалд файл байгаа эсэхийг шалгах
      const filePath = await this.fileService.getFile(filename);
      const type = mime.lookup(filename) || 'application/pdf';

      res.setHeader('Content-Type', type);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.status(HttpStatus.OK);

      const stream = createReadStream(filePath);
      stream.pipe(res);
    } catch (error) {
      console.error(error);
      res.status(500).send('Report not available');
    }
  }
}
