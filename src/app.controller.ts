import {
  Controller,
  Get,
  Param,
  Request,
  Response as NestResponse,
  Res,
  Post,
  Put,
  Headers,
  UseGuards,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ApiParam } from '@nestjs/swagger';
import type { Response as ExpressRes, Response } from 'express';
import { FileService } from './file.service';
import { InternalKeyGuard } from './guards/internal-key.guard';
import { createHash, timingSafeEqual } from 'crypto';
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
    const data = dto;
    return this.service.createReport(data);
  }
  // @Get('mail/:jobId/:status')
  // updateMailStatus(
  //   @Param('jobId') jobId: string,
  //   @Param('status') status: REPORT_STATUS,
  // ) {
  //   this.service.updateMailStatus(jobId, status);
  // }
  // @Get('get/code/:code')
  // getByCode(@Param('code') code: string) {
  //   return this.service.getByCode(code);
  // }
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
    // @Res() ашигласан route дээр Nest-ийн автомат exception filter
    // хариу бичихгүй тул энд заавал өөрөө барьж 404/500-г ил тод буцаана
    // (өмнө нь NotFoundException catch-гүйгээр дээш шидэгдэж, core талд
    // "ERR_BAD_RESPONSE 500" болж харагддаг байсан).
    try {
      const stream = await this.fileService.getFile(filename, res);

      if (!stream) {
        return res.status(404).end();
      }

      stream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(404).end();
      }
      console.error('getFile error:', error);
      return res.status(500).end();
    }
  }

  // Ops "PDF гараар солих" (core: ops.service.ts uploadPdf()). core `express.raw`
  // (main.ts) -оор бэлдсэн Buffer-ийг шууд @Body()-ээр хүлээж авна — JSON биш.
  @Put('/internal/files/:name')
  @UseGuards(InternalKeyGuard)
  @ApiParam({ name: 'name' })
  async putInternalFile(
    @Param('name') name: string,
    @Body() body: Buffer,
    @Headers('x-content-sha256') expectedSha256?: string,
  ) {
    if (!Buffer.isBuffer(body) || !body.length) {
      throw new BadRequestException('file body шаардлагатай (application/pdf)');
    }
    if (expectedSha256) {
      const actual = createHash('sha256').update(body).digest();
      const expected = Buffer.from(expectedSha256.toLowerCase(), 'hex');
      if (expected.length !== actual.length || !timingSafeEqual(actual, expected)) {
        throw new BadRequestException('sha256 таарсангүй');
      }
    }
    const { size, replaced } = await this.fileService.saveFile(name, body);
    return { name, size, replaced };
  }

  @Get('/calculate/:code')
  @ApiParam({ name: 'code' })
  async calculate(@Param('code') code: string) {
    return await this.service.calculateExamById(code);
  }

  // Studio-ийн "PDF-ээр урьдчилан харах" — { template } биеийг хүлээж авч,
  // demo дата ашиглан шууд PDF болгож урсгана. Template хадгалагдсан байх
  // шаардлагагүй (шинэ, DB-д байхгүй ч ажиллана). { examCode } өгвөл demo-гийн
  // оронд ТУХАЙН бодит (дуусгасан) тестийн жинхэнэ дата ашиглана.
  @Post('template/preview')
  async previewTemplate(
    @Body() dto: { template: any; examCode?: string },
    @NestResponse() res: ExpressRes,
  ) {
    const doc = await this.service.previewPdf(dto.template, dto.examCode);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="preview.pdf"');
    res.setHeader('Cache-Control', 'no-store');
    doc.pipe(res);
    doc.end();
  }
  @Get('core/:code')
  @ApiParam({ name: 'code' })
  async getReport(@Param('code') code: string, @Res() res: Response) {
    try {
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
