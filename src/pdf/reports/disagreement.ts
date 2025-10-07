import { Injectable } from '@nestjs/common';
import { ResultEntity, ExamEntity, ResultDetailEntity } from 'src/entities';
import {
  colors,
  fontBold,
  fontNormal,
  footer,
  header,
  info,
  lh,
  marginX,
  title,
} from 'src/pdf/formatter';
import { VisualizationService } from '../visualization.service';
import { AssetsService } from 'src/assets_service/assets.service';
const sharp = require('sharp');

interface Result {
  name: string;
  name_mn: string;
  description: string;
  image: string;
  intro: string;
  result: string;
  question: string;
  high: string;
  low: string;
  example: string;
  quote: string;
  icon: string;
}

@Injectable()
export class Disagreement {
  constructor(private vis: VisualizationService) {}

  public result(v: string) {
    let res: Result = {
      name: '',
      name_mn: '',
      description: '',
      image: '',
      intro: '',
      result: '',
      question: '',
      high: '',
      low: '',
      example: '',
      quote: '',
      icon: '',
    };

    const value = v.toLowerCase();
    if (value == 'хамтран ажиллагч (collaborating)') {
      res = {
        name: 'Collaborating',
        name_mn: 'Хамтран ажиллагч',
        description:
          'Энэхүү хэв шинжийн хүмүүс нь санал зөрөөтэй асуудалд хандахдаа бусдын үзэл бодлыг ойлгохыг хичээж, өөрийн болон бусдын хэрэгцээг зэрэг хангахыг чухалчилдаг.',
        image: 'collab',
        intro:
          'Энэхүү хэв шинжийн хүмүүс нь санал зөрөөтэй асуудалд хандахдаа бусдын үзэл бодлыг ойлгохыг хичээж, өөрийн болон бусдын хэрэгцээг зэрэг хангахыг чухалчилдаг.',
        result:
          'Хамтран ажиллагч буюу хамтрах хандлагатай хэв шинжид багтах хүмүүс нь аливаа үүссэн үл ойлголцол, маргааныг шийдвэрлэхдээ оролцогч талуудад харилцан ашигтай шийдвэр гаргахыг зорьдог. Мэдээж энэ зорилгод хүрэхийн тулд биднээс нээлттэй ил тод харилцаа, бусдын оронд өөрийгөө тавьж, бусдыг ойлгох, туслах чадвар, мөн түүнчлэн бие биенийхээ бодол санааг харилцан ойлголцохыг эрхэмлэх чадвар шаардагдана. Энэ төрлийн хэв шинж нь үүссэн үл ойлголцлыг ямар нэгэн аргаар шийдвэрлээд орхих биш, харин оролцогч бүх талуудын хүсэл сонирхол, эрх ашгийг харгалзан үзсэн нэгдсэн шийдвэр гаргахад чиглэдэг.',
        question:
          '• Аливаа үл ойлголцол, маргаантай асуудалтай тулгарсан үедээ та хамтран ажиллагч байж чаддаг уу?\n• Бүх талуудын хэрэгцээг харгалзан үзсэн, “win-win” буюу бүгдэд ашигтай шийдэл олохыг та хэр их хичээдэг вэ?',
        high: '• Хамтран ажиллах үйл явц нь шийдвэр гаргах процессыг хэт удаашруулахгүй байх.\n• Хэт их санал хүсэлт орсон, хэт төвөгтэй шийдвэр гаргахаас болгоомжлох.\n• Чанга ярьсан, их ярьсан хүмүүсийн биш, харин бүх хүний дуу хоолойг сонсоход анхаарах.\n• Хамтран ажиллах явцдаа, илүү үр ашигтай байхад анхаарах.\n• Тогтсон нэг төрлийн хамтын ажиллагаанаас зайлсхийх.',
        low: '• Бүх талуудын оролцоог хангахад анхаарах.\n• Багаас гарсан шийдвэрийг илүү чухалчлах.\n• Баг доторх хүмүүсийн өвөрмөц шинж чанар, үзэл санааг илүү үнэлж, хүндлэхэд анхаарах.\n• Өөр үзэл бодол, шинэ санааг идэвхтэй хайх.\n• Хамтран ажиллах үнэ цэнийг тунгаан ойлгохыг хичээх.',
        example:
          '“Би таны үзэл, хэлэх гэсэн санааг ойлголоо, надад мөн адил нэг бодол байна. Хоёулаа хамтдаа аль аль талаа харгалзан үзсэн шийдэл олох уу?”',
        quote:
          '“Үл ойлголцол үргэлж үүсдэг, харин маргалдаж тэмцэлдэх нь сонголт юм.”\n— Макс Лукадо',
        icon: 'collab2',
      };
    }
    if (value == 'өрсөлдөгч (competing)') {
      res = {
        name: 'Competing',
        name_mn: 'Өрсөлдөгч',
        description:
          'Энэ хэв шинжид хамрагдах хүмүүс өөрийн зорилго, үзэл санааг бусдаас илүүд тавьдаг. Бусадтай үүсгэсэн харилцаагаа хадгалж үлдэхээс илүү өөрийн зорилгодоо хүрэх, өөрийн зөвийг батлахыг илүүтэй чухалчилдаг хандлагатай байдаг.',
        image: 'ursuldugch',
        intro:
          'Энэ хэв шинжид хамрагдах хүмүүс өөрийн зорилго, үзэл санааг бусдаас илүүд тавьдаг. Бусадтай үүсгэсэн харилцаагаа хадгалж үлдэхээс илүү өөрийн зорилгодоо хүрэх, өөрийн зөвийг батлахыг илүүтэй чухалчилдаг хандлагатай байдаг.',
        result:
          'Өрсөлдөгч хэв шинжийн хүмүүс нь үл ойлголцол, маргаанд хариу үзүүлэхдээ илүү өөртөө итгэлтэй, эрс шийдэмгий, бусадтай хамтраагүй биеэ даасан хандлага гаргадаг. Өөрөөр хэлбэл энэ төрлийн хүмүүс илүү эрх мэдэлд суурилсан шийдвэр гаргах бөгөөд бусад хүний үзэл бодлоос урьдаж өөрийн үзэл бодлыг батлахыг хичээдэг. Энэ арга яаралтай цаг үед хурдан шуурхай шийдвэр гаргахад тус болдог хэдий ч хэтрүүлсэн үед байгууллага, баг доторх уур амьсгалыг эвдэж, багийн гишүүдийн хооронд бие биедээ дайсагнасан хандлагад хүргэнэ. Тиймээс энэхүү аргыг бусад аргатай хослуулж, бусад хүмүүсийн хэрэгцээ, шаардлагад мэдрэмжтэй хандах нь цаашид харилцааг нураахгүйгээр хамтран ажиллах уур амьсгалыг бий болгоход чухал ач холбогдолтой. ',
        question:
          '• Аливаа үл ойлголцол, маргаантай асуудал дээр өөртөө итгэлтэй, шийдэмгий байдлаа зөв ашиглаж чаддаг уу?\n• Та магадгүй бусадтай харилцах харилцаандаа хэт давамгайлсан үүрэгтэй оролцож байна уу?',
        high: '• Зөвхөн ялалт биш, харилцаа ч мөн адил чухал гэдгийг санах.\n• Бусдын сэтгэл хөдлөл, мэдрэмж, хариу үйлдэлд анхаарах.\n• Эсрэг өөр үзэл, санал бодлыг дэмжихийг хичээх.\n• Идэвхтэй, шийдэмгий байдал болон хамтын ажиллах чадварын тэнцвэрийг хадгалах.\n• Та өөрийн өрсөлдөх хандлагаас гарч буй үр дүн, нөлөөллийг тунгаан бодох.',
        low: '• Ямар цаг үед өөртөө урам өгч, өөртөө итгэлтэй байх ёстой гэдгийг тунгаах, мэдэх.\n• Зарим үед санал зөрсөн маргаанаас эерэг үр дүн гардаг гэдгийг ойлгох.\n• Өөртөө итгэх, өөртөө итгэлтэй байхад өөрийгөө сургах, дадал нэвтрүүлэх.\n• Өөрийн хэрэгцээ, шаардлагыг илүү тодорхойгоор илэрхийлж сурах.\n• Ямар үед өөртөө итгэлтэй байдал нь эерэг үр дүн авчирч, ашигтай байх талаар тунгаан, эргэцүүлж бодох.',
        example:
          '“Би таны үзэл, хэлэх гэсэн санааг ойлголоо, би бас өөрийн үзэл бодлоо хуваалцмаар байна. Миний ингэж бодож, итгэлтэй байгаа шалтгаан бол...”',
        quote: '“Бэрхшээлийн дунд боломж нуугдаж байдаг.”\n— Альберт Эйнштейн',
        icon: 'ursuldugch2',
      };
    }
    if (value == 'зайлсхийгч (avoiding)') {
      res = {
        name: 'Avoiding',
        name_mn: 'Зайлсхийгч',
        description:
          'Энэ төрлийн хүмүүс нь үл ойлголцол, маргаанд оролцолгүй, зайлсхийхийн тулд өөрийн зорилгоосоо ухарч магадгүй. Хэдийгээр богино хугацаанд эв нэгдэлтэй байдлыг хадгалж үлдэх болов ч урт хугацаандаа шийдвэрлээгүй асуудлууд дахин төрөн гарахад хүргэж болно.',
        image: 'avoid',
        intro:
          'Энэ хэв шинжид хамрагдах хүмүүс өөрийн зорилго, үзэл санааг бусдаас илүүд тавьдаг. Бусадтай үүсгэсэн харилцаагаа хадгалж үлдэхээс илүү өөрийн зорилгодоо хүрэх, өөрийн зөвийг батлахыг илүүтэй чухалчилдаг хандлагатай байдаг.',
        result:
          'Энэ төрлийн хүмүүс нь үл ойлголцол, маргаанд оролцолгүй, зайлсхийхийн тулд өөрийн зорилгоосоо ухарч магадгүй. Хэдийгээр богино хугацаанд эв нэгдэлтэй байдлыг хадгалж үлдэх болов ч урт хугацаандаа шийдвэрлээгүй асуудлууд дахин төрөн гарахад хүргэж болно. Аливаа үл ойлголцол, маргаантай асуудалд оролцохоос зугтах, эсвэл хойшлуулдаг бол энэ нь зайлсхийгч буюу зайлсхийх хэв шинж юм. Энэ төрлийн асуудлыг шийдвэрлэх арга замууд хэдийгээр түр зуур ажиллах болов ч, урт хугацааны шийдэл болж чадахгүй. Асуудлаас зугтах байдал нь удаан үргэлжилбэл, цаашдаа хүмүүсийн хоорондын харилцааг эвдэж, баг хамтдаа хөгжиж дэвшихэд саад болно.',
        question:
          '• Асуудал, үйл ойлголцлоос зайлсхийснээр та багийн/байгууллагын доторх эв нэгдлийг хадгалахад тус болж байна уу?\n• Таны хувьд хойш тавьсан, шийдэлгүй орхисон маргаантай асуудлууд стресс үүсгэж байна уу?',
        high: '• Өөртөө итгэж, өөрийн үзэл бодлоо чөлөөтэй илэрхийлж сурахад анхаарах.\n• Эхлээд жижиг асуудлууд дээр ажиллах, суралцах.\n• Дүрд тоглох байдлаар асуудлыг шийдвэрлэх дасгалууд дээр ажиллах.\n• Үл ойлголцол, асуудлаас зайлсхийснээр гарах урт хугацааны үр нөлөөг тунгаан бодож байх.\n• Хэрэв шаардлагатай гэж үзвэл ментор болон бусад мэргэжлийн хүнээс зөвлөгөө дэмжлэг аваарай.',
        low: '• Үл ойлголцсон, маргаантай хэлэлцүүлгийн үед хэзээ завсарлага авахаа мэддэг байх.\n• Харилцан ярианы үед асуудал ширүүсэж буйг мэдрэх чадвараа хөгжүүлэх.\n• Үл ойлголцсон, санал зөрсөн асуудал дээр бусдыг сэтгэл хөдлөл, мэдрэмж, хариу үйлдлийг мэдэч ойлгоход анхаарах.\n• Хэлэлцээр хийх, харилцан ойлголцох чадвараа сайжруулах.\n• Үнэнч нээлттэй харилцаа, дуу хоолгүйг харилцааг дэмжиж, урамшуулахыг хичээх.',
        example:
          '“Энэ асуудал бол мэдээж чухал гэдгийг ойлгож байна. Гэхдээ хоёулаа энэ тухай дараа илүү тайван, тухтай үедээ сайн цаг гарган дэлгэрэнгүй ярилцвал ямар вэ?”',
        quote:
          '“Хэн нэгэнтэй үл ойлголцолд орсон үед харилцаагаа цаашид сүйрүүлэх үү, эсвэл сайжруулах уу гэдгийг шийддэг гол хүчин зүйл бол хандлага юм.”\n— Уильям Жэймс',
        icon: 'avoid2',
      };
    }
    if (value == 'буулт хийгч (accommodating)') {
      res = {
        name: 'Accommodating',
        name_mn: 'Буулт хийгч',
        description:
          'Бусдын эрх ашиг, сонирхлыг түрүүнд тавьдаг хүмүүс энэ төрөлд орно. Энэ төрлийн хүмүүс нь голдуу хүмүүстэй үүсгэсэн холбоо харилцаагаа өөрийн ашиг сонирхлоос дээгүүр тавих хандлагатай. ',
        image: 'buult',
        intro:
          'Бусдын эрх ашиг, сонирхлыг түрүүнд тавьдаг хүмүүс энэ төрөлд орно. Энэ төрлийн хүмүүс нь голдуу хүмүүстэй үүсгэсэн холбоо харилцаагаа өөрийн ашиг сонирхлоос дээгүүр тавих хандлагатай.',
        result:
          'Буулт хийгч буюу буулт хийх хандлагатай хүмүүс нь хамтран ажиллахад нээлттэй байдаг болов ч харьцангуй өөртөө итгэх итгэл багатай, харилцаагаа хэт чухалчилж, өөрийн эрх ашгийг хойш тавьдаг, бусдын сэтгэл санаанд нийцэхийг илүүтэй анхаардаг хүмүүс орно. Энэ төрлийн асуудлыг шийдвэрлэх хандлага нь мэдээж эв найрамдалтай байдлыг хангах хэдий ч хувь хүний талаас хүн өөрийн хэрэгцээ, хүсэл тэмүүлэл орхигдуулахгүй, тэнцвэртэй байхад анхаарах хэрэгтэй.',
        question:
          '• Та бусадтай эв найрамдалтай байхын тулд өөрийн хэрэгцээ шаардлагаа хойш тавьдаг уу?\n• Танд болон бусдад ашигтай илүү тэнцвэртэй байдал байж болох байсан уу?',
        high: '• Үргэлж бусад хүмүүсийн хүсэлд нийцүүлснээр та өөрийн эрх ашгаа хайхрахгүй байх эрсдэлтэйг анхаарах.\n• Таны өөрийн санаа бодол тусгагдаж буй эсэхийг анхаарч байх хэрэгтэй.\n• Өөрийгөө болон өөрийн үзэл санаагаа итгэлтэйгээр илэрхийлж сурах.\n• Гарсан шийдвэрүүдтэй та үнэхээр санал нийлж буй эсэхээ эргэцүүлэх.\n• Шаардлагатай үед үгүй гэж хэлж сурах.',
        low: '• Бусдыг идэвхтэй, анхаарч сонсох чадвараа хөгжүүлэх.\n• Бусдын сэтгэл хөдлөл, мэдрэмж, хариу үйлдэлд анхаарах.\n• Ямар үед буулт хийж, тохиролцоонд хүрч болох боломжтой талаар тунгаан бодох.\n• Асуудлыг шийдвэрлэх өөр гарц, шийдлүүд байж болохыг ухаарах, идэвхтэй хайж байх.\n• Яагаад маргаанд ялалт байгуулахаас илүүтэй харилцаа, нөхөрлөлийн үнэ цэн чухал болох талаар тунгаан бодох.',
        example:
          '“Би таны хэлж буй санааг сайн ойлголоо. Таны хэлж буй зүйлс яг миний төсөөлсөн, хүссэн зүйлстэй нийцэхгүй байгаа ч гэсэн, шийдэлд хүрэх шаардлага, хамтын ажиллагаа чухал учраас би таны саналыг дагаж байна.”',
        quote:
          '“Харилцаанд хамгийн чухал нь ил яригдаагүй зүйлсийг сонсох чадвар юм.”\n— Питер Дракер',
        icon: 'buult2',
      };
    }
    if (value == 'тохиролцогч (compromising)') {
      res = {
        name: 'Compromising',
        name_mn: 'Тохиролцогч',
        description:
          'Тохиролцох хэв шинж нь талууд аль аль нь буулт хийх замаар дундын зорилгодоо хүрэхийг хэлнэ. Энэ төрөлд хамрах хүмүүс нь харилцан ойлголцолд хүрэхийн тулд өөрийн зүгээс тодорхой золиос гаргах тал дээр илүү нээлттэй ханддаг.',
        image: 'tohiroo',
        intro:
          'Тохиролцох хэв шинж нь талууд аль аль нь буулт хийх замаар дундын зорилгодоо хүрэхийг хэлнэ. Энэ төрөлд хамрах хүмүүс нь харилцан ойлголцолд хүрэхийн тулд өөрийн зүгээс тодорхой золиос гаргах тал дээр илүү нээлттэй ханддаг.',
        result:
          'Тохиролцогч буюу тохиролцох хандлагатай хэв шинжийн хүмүүс нь асуудлыг шийдвэрлэхдээ хоёр талаас өгч авсан, харилцан буулт хийсэн зарчмаар хандахыг эрхэмлэдэг. Мэдээж энэ аргыг ашигласнаар харьцангуй хурдан шийдвэрт хүрэх ч талуудын бүх хэрэгцээг бүрэн дүүрэн хангахгүй байх нь түгээмэл. Үл ойлголцсон асуудалд хандахдаа багын доторх өрсөлдөөн болон нөхөрсөг байдлын аль аль талуудыг сайтар хослуулж чадвал энэ арга илүү үр дүнтэй байх боломжтой. Гэхдээ энэ стратегийг ашиглах үед бүх талууд өөрсдийн эрх ашиг нь ижил хэмжээнд, хангалттай тусгагдсан эсэхийг анхаарал мэдэх, шалгах шаардлагатай.',
        question:
          '• Таны харилцан буулт хийх аргыг хэр их ашиглаж байна вэ? Таньд үр дүнгээ өгч байна уу?\n• Илүү үр дүнд хүрэхийн тулд энэ аргыг илүү их ашиглах хэрэгтэй гэж бодож байна уу?',
        high: '• Түргэн шийдэл хүрэх нь үргэлж асуудлын жинхэнэ учир шалтгааныг засах шийдэл биш гэдгийг анхаарах.\n• Буулт хийх аргыг хэрэглэх үед бусад хүмүүс сэтгэл ханамжгүй эсвэл хагас сэтгэл ханамжтай үлдэж байгаа эсэхийг анхаарах.\n• Зүгээр л буулт хийхийн тулд чухал стандартаа бууруулж болохгүй.\n• Буулт хийх ба жинхэнэ хамтын ажиллагааны ялгааг эргэцүүлэн тунгаан бодох.\n• Үргэлж хэлэлцээр хийх, буулт хийх замыг сонгосноор гарч болох стресс болон ажлаас халшрах  хам шинжээс сэргийлэх.',
        low: '• Бүх асуудал маргаанд ялалт байгуулах шаардлагагүй  гэдгийг ойлгож, эргэцүүлэх.\n• Үл ойлголцсон асуудалд буулт хийж сурах, суралцах, турших.\n• Тийм ч их чухал биш зүйлсийг орхиж сурах.\n• Бусад хүний өмнөөс өөрийгөө тавьж, бусдын гаргаж буй өнцгөөс харахыг хичээх.\n• Асуудал, маргаанд хандахдаа тэнцвэртэй зарчим барихыг гол зорилгоо болгон ажиллах.',
        example:
          '“Бидний ярьж буй үзэл санаа аль аль талдаа их чухал гэдгийг ойлголоо. Бүгдээрээ хоёр талын хэрэгцээ, шаардлагыг хангах, дундын шийдэлд хүрэх гээд үзье.”',
        quote:
          '“Энх тайван гэдэг бол зөрчил маргаангүй байдал биш, харин үүссэн үл ойлгол, асуудлыг тайван аргаар зохицуулах чадвар юм.”\n— Рональд Рейган',
        icon: 'tohiroo2',
      };
    }
    return res;
  }

  async template(
    doc: PDFKit.PDFDocument,
    service: AssetsService,
    result: ResultEntity,
    firstname: string,
    lastname: string,
    exam: ExamEntity,
  ) {
    try {
      header(doc, firstname, lastname, service);
      title(doc, service, result.assessmentName);
      info(
        doc,
        service,
        exam.assessment.author,
        exam.assessment.description,
        exam.assessment.usage,
      );
      doc.font(fontBold).fontSize(13).text('Юуг хэмждэг вэ?').moveDown(0.5);

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Үл ойлголцлыг шийдвэрлэх хэв шинжийг тодорхойлох сорил нь хүмүүсийн дундах зөрчлийг зохицуулахад ажиглагддаг үндсэн таван хэв шинжийг илрүүлж, үнэлнэ. Асуумжийн арга нь ач холбогдлын хосолсон онолын загвар болон “Thomas-Kilmann”-ны онолд суурилсан.\n\nҮл ойлголцлыг шийдвэрлэх хэв шинжийг тодорхойлох сорилыг ашиглаж хүмүүсийн дундах зөрчлийг зохицуулах хандлагыг үнэлж, зөрчлийг шийдвэрлэхэд туслах, хүмүүсийн хоорондох харилцаа, багийн ажиллагаа, баг бүрдүүлэлт, манлайллыг сайжруулах, хувь хүний хөгжил, байгууллагын дотор ажилтнуудад зөрчилдөөнийг шийдвэрлэхэд туслах хэрэгсэл болгож ашиглах боломжтой.',
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Тестийн тухай');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сорилын үр дүн дээр үндэслэн дараах үндсэн 5 хэв шинжид хүмүүсийг хуваадаг. Үүнд:',
          { align: 'justify' },
        )
        .moveDown(1);
      const types = [
        'хамтран ажиллагч (collaborating)',
        'өрсөлдөгч (competing)',
        'зайлсхийгч (avoiding)',
        'буулт хийгч (accommodating)',
        'тохиролцогч (compromising)',
      ];

      const startX = marginX;
      let startY = doc.y;
      const tableWidth = doc.page.width - marginX * 2;

      const leftW = tableWidth * 0.3;
      const rightW = tableWidth * 0.7;
      const rowHeight = 115;

      doc.lineWidth(1).strokeColor('#000');

      doc
        .moveTo(startX, startY)
        .lineTo(startX + tableWidth, startY)
        .stroke();

      doc
        .moveTo(startX, startY)
        .lineTo(startX, startY + rowHeight * types.length)
        .stroke();

      doc
        .moveTo(startX + leftW, startY)
        .lineTo(startX + leftW, startY + rowHeight * types.length)
        .stroke();

      doc
        .moveTo(startX + tableWidth, startY)
        .lineTo(startX + tableWidth, startY + rowHeight * types.length)
        .stroke();

      for (let i = 0; i < types.length; i++) {
        const v = this.result(types[i]);
        const y = startY + i * rowHeight;

        doc
          .moveTo(startX, y + rowHeight)
          .lineTo(startX + tableWidth, y + rowHeight)
          .stroke();

        const imgPath = service.getAsset(`icons/disagreement/${v.icon}`);
        const imgSize = Math.min(leftW - 30, rowHeight - 20);
        doc.image(imgPath, startX + 30, y + 10, {
          width: imgSize,
          height: imgSize,
        });

        doc
          .font(fontBold)
          .fontSize(12)
          .fillColor(colors.black)
          .text(v.name_mn, startX + leftW + 10, y + 15, {
            width: rightW - 20,
          });

        doc
          .font(fontNormal)
          .fontSize(11)
          .fillColor(colors.black)
          .text(v.description, startX + leftW + 10, y + 28, {
            width: rightW - 20,
            align: 'justify',
          });
      }

      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Таны өөрийн сорилын үр дүнг дараах хүрдэн диаграмм дээрээс харна уу! Энэхүү графикт үл ойлголцолд хариу өгөх таван төрлийн хэв шинж тус бүрд харгалзах таны авсан оноог (хувь) тооцоолж дүрслэлээ.',
          marginX,
          doc.y,
          { align: 'justify' },
        );
      const details: ResultDetailEntity[] = result.details;
      const indicator = [];
      const data = [];
      const results = [];

      for (const detail of details) {
        const result = this.result(detail.value);
        indicator.push({
          name: result.name_mn,
          max: 100,
          // key: result.key,
        });
        data.push(Math.round((+detail.cause / 12) * 100));
        results.push({ ...result, point: +detail.cause, value: detail.value });
      }

      let y = doc.y;
      const pie = await this.vis.createRadar(indicator, data);
      let jpeg = await sharp(pie)
        .flatten({ background: '#ffffff' }) // ил тод байдал → цагаан дэвсгэр
        .jpeg({ quality: 90, progressive: false }) // interlaceгүй, pdfkit-д найдвартай
        .toBuffer();
      doc.image(jpeg, 75, y + 10, {
        width: doc.page.width - 150,
      });

      doc.y += (doc.page.width / 425) * 310 - 150;
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Бид таны авсан оноон дээр үндэслэж, үл ойлголцол, маргааныг шийдвэрлэх үндсэн таван төрөл тус бүр дээр илүү дэлгэрэнгүй мэдээлэл, цаашид өөрийгөө хөгжүүлэхэд тань чиглэсэн зөвлөгөөнүүдийг бэлтгэж гаргалаа. Цааш хуудсаа эргүүлэхээс өмнө та дараах асуултанд өөртөө хариулна уу?',
          marginX,
          doc.y + 25,
          { align: 'justify' },
        )
        .moveDown(1);

      doc
        .fontSize(12)
        .font(fontNormal)
        .list(
          [
            'Таны төсөөлж байсан оноо, сорилын үр дүн юу байсан бэ?',
            'Таньд аль төрөл, хэв шинж илүүтэй таалагдсан бэ?',
            'Өөрийн сорилын үр дүнг харсны дараагаар таньд ямар сэтгэгдэл төрсөн бэ?',
            'Хэрвээ таньд цаашид засаж сайжруулахыг хүсэж буй төрөл, хэв шинж байгаа бол, аль хэв шинжийг та сонгох байсан бэ?',
          ],
          {
            bulletRadius: 1.5,
            align: 'justify',
          },
        );
      footer(doc);
      results.sort((a, b) => b.point - a.point);

      for (const r of results) {
        doc.addPage();
        header(doc, firstname, lastname, service, r.name_mn);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(r.intro, { align: 'justify' })
          .moveDown(1);

        const startX = marginX;
        let startY = doc.y;
        const tableWidth = doc.page.width - marginX * 2;
        const leftW = tableWidth * 0.35;
        const rightW = tableWidth * 0.65;
        const rowHeight = 180;

        doc.lineWidth(1).strokeColor('#000');

        doc
          .moveTo(startX, startY)
          .lineTo(startX + tableWidth, startY)
          .stroke();
        doc
          .moveTo(startX, startY)
          .lineTo(startX, startY + rowHeight)
          .stroke();
        doc
          .moveTo(startX + leftW, startY)
          .lineTo(startX + leftW, startY + rowHeight)
          .stroke();
        doc
          .moveTo(startX + tableWidth, startY)
          .lineTo(startX + tableWidth, startY + rowHeight)
          .stroke();
        doc
          .moveTo(startX, startY + rowHeight)
          .lineTo(startX + tableWidth, startY + rowHeight)
          .stroke();

        const imgPath = service.getAsset(`icons/disagreement/${r.image}`);
        const imgSize = Math.min(leftW, rowHeight - 15);
        doc.image(imgPath, startX + 10, startY + 10, {
          width: imgSize,
          height: imgSize,
        });

        const scorePct = Math.round((r.point / 12) * 100);
        const pie = await this.vis.doughnut(colors.nonprogress, 100, scorePct);
        const width = (doc.page.width - marginX * 2) / 2;
        doc.image(pie, startX + leftW + 40, startY + 15, { width });

        const xPosition = startX + leftW + 150;
        const yPosition = startY + 104;

        let levelLabel = '';

        if (scorePct <= 33) {
          levelLabel = 'ХАРЬЦАНГУЙ БАГА';
        } else if (scorePct <= 66) {
          levelLabel = 'ДУНД ТҮВШИН';
        } else {
          levelLabel = 'ХАРЬЦАНГУЙ ӨНДӨР';
        }

        const baseX = xPosition + 22;

        const label = 'Таны оноо';
        doc.font(fontNormal).fontSize(12).fillColor(colors.black);
        const labelWidth = doc.widthOfString(label);
        doc.text(label, baseX - labelWidth / 2, yPosition + 30);

        const pct = `${scorePct}%`;
        doc.font('fontBlack').fillColor(colors.orange).fontSize(28);
        const pctWidth = doc.widthOfString(pct);
        doc.text(pct, baseX - pctWidth / 2, yPosition);

        doc.font('fontBlack').fontSize(16).fillColor(colors.orange);
        const levelWidth = doc.widthOfString(levelLabel);
        doc.text(levelLabel, baseX - levelWidth / 2, yPosition + 50);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(r.result, marginX, startY + rowHeight + 20, {
            align: 'justify',
          })
          .moveDown(1);

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(
            'Та энэ хэв шинжид харгалзах өөрийн авсан оноогоо эргэцүүлж, дараах асуултуудад дотроо хариулаарай.',
            {
              align: 'justify',
            },
          )
          .moveDown(0.5);
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(r.question, doc.x + 20, doc.y, {
            align: 'justify',
          })
          .moveDown(1);
        doc
          .font(fontBold)
          .fillColor(colors.black)
          .fontSize(12)
          .text('Ашиглаж болох жишээ үг хэллэгүүд:', marginX)
          .moveDown(0.5);
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(r.example, {
            align: 'justify',
          })
          .moveDown(1);
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(r.quote, {
            align: 'justify',
          })
          .moveDown(1);
        footer(doc);
        doc.addPage();
        header(doc, firstname, lastname, service, r.name_mn);
        doc
          .font(fontBold)
          .fillColor(colors.black)
          .fontSize(12)
          .text(
            'Хэрэв таны оноо харьцангуй өндөр буюу та энэ төрлийг ихэвчлэн ашигладаг бол:',
          )
          .moveDown(0.5);
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(r.high, doc.x + 20, doc.y, {
            align: 'justify',
          })
          .moveDown(1);

        doc
          .font(fontBold)
          .fillColor(colors.black)
          .fontSize(12)
          .text(
            'Хэрэв таны оноо харьцангуй бага бол (та энэ төрлийг төдийлөн хэрэглэдэггүй бол):',
            marginX,
          )
          .moveDown(0.5);
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(r.low, doc.x + 20, doc.y, {
            align: 'justify',
          })
          .moveDown(1);
        footer(doc);
      }
    } catch (error) {
      console.log('disagreement', error);
    }
  }
}
