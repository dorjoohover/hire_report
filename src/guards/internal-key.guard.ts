import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';

// core/src/auth/guards/internal/internal-key.guard.ts-той ижил зарчим (тэндхийн
// тайлбарыг харна уу) — зөвхөн core → hire_report чиглэлийн дотоод дуудлагыг
// (`PUT /internal/files/:name`, Ops "PDF гараар солих") хамгаална. Хэрэглэгчийн
// JWT биш, тогтмол `INTERNAL_API_KEY` (core ба hire_report-ийн .env хоёуланд
// ИЖИЛ утга). Түлхүүр тохируулаагүй бол fail-closed (401) — "хамгаалалтгүй
// нээлттэй" гэсэн буруу төлөвт унахгүй.
@Injectable()
export class InternalKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const expected = process.env.INTERNAL_API_KEY;

    if (!expected) {
      throw new UnauthorizedException('Internal API access is not configured.');
    }

    const provided = req.headers?.['x-internal-key'];
    if (typeof provided !== 'string' || !provided) {
      throw new UnauthorizedException('Invalid internal key.');
    }

    // Урт өөр байсан ч timingSafeEqual алдаа өгөхгүйн тулд hash-лаад харьцуулна.
    const a = createHash('sha256').update(provided).digest();
    const b = createHash('sha256').update(expected).digest();
    if (!timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid internal key.');
    }
    return true;
  }
}
