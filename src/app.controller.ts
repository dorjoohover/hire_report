import {
  Controller,
  Get,
  Param,
  Request,
  Response as NestResponse,
  Res,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ApiParam } from '@nestjs/swagger';
import type { Response as ExpressRes, Response } from 'express';
import * as mime from 'mime-types';
import { FileService } from './file.service';
import { createReadStream } from 'fs';
import { REPORT_STATUS } from './base/constants';
@Controller()
export class AppController {
  constructor(
    private service: AppService,
    private fileService: FileService,
  ) {}
  @Get('check')
  // @Public
  check() {
    return this.service.check();
  }
  @Post()
  async create(@Body() dto: any) {
    console.log(dto, 'create');
    const data = dto;
    return this.service.createReport(data);
  }
  @Get('mail/:jobId/:status')
  updateMailStatus(
    @Param('jobId') jobId: string,
    @Param('status') status: REPORT_STATUS,
  ) {
    this.service.updateMailStatus(jobId, status);
  }
  @Get('get/code/:code')
  getByCode(@Param('code') code: string) {
    return this.service.getByCode(code);
  }
  @Get('job/:job')
  getStatus(@Param('job') job: string) {
    return this.service.getStatus(job);
  }

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
    const doc = await this.service.getPdf(code, role);

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
  async getFile(@Param('file') filename: string, @Res() res: ExpressRes) {
    const stream = await this.fileService.getFile(filename, res);

    if (!stream) {
      return res.status(404).end();
    }

    stream.pipe(res);
  }
  @Get('/calculate/:code')
  @ApiParam({ name: 'code' })
  async calculate(@Param('code') code: string) {
    return await this.service.calculateExamById(code);
  }
  @Get('core/:code')
  @ApiParam({ name: 'code' })
  async getReport(@Param('code') code: string, @Res() res: Response) {
    try {
      console.log(code);
      const filename = `report-${code}.pdf`;

      // Локалд файл байгаа эсэхийг шалгах
      const filePath = await this.fileService.getFile(filename, res);

      filePath.pipe(res);
    } catch (error) {
      console.error(error);
      res.status(500).send('Report not available');
    }
  }
}
