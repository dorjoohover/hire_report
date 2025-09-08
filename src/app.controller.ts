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
  @Get('core/:code')
  @ApiParam({ name: 'code' })
  async main(@Param('code') code: string, @Res() res: Response) {
    try {
      const filename = `report-${code}.pdf`;

      console.log(filename);
      // (шаардлагатай бол эрх шалгалтаа энд)
      await this.service.checkExam(+code);

      const { path, size } = await this.fileService.getFileBuf(filename);
      const type = (mime.lookup(filename) as string) || 'application/pdf';

      // Толгойг тодорхой тавина — зарим прокси/шахалтэнд зайлшгүй хэрэгтэй
      res.setHeader('Content-Type', type);
      res.setHeader('Content-Length', size.toString());
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.status(HttpStatus.OK);

      const stream = createReadStream(path);
      stream.on('open', () => {
        // шууд дамжуулна
        stream.pipe(res);
      });
      stream.on('error', (err) => {
        // stream алдаа гарвал 500 хэлээд хаая
        if (!res.headersSent) res.status(500);
        res.end(`Stream error: ${err?.message ?? 'unknown'}`);
      });
    } catch (error) {
      console.log(error);
    }
  }
}
