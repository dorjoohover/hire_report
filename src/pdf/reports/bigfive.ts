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
  color: string;
  fill: string;
  image: string;
  high: string;
  low: string;
  people1: string;
  people2: string;
  people3: string;
  people4: string;
  people5?: string;
  icon: string;
  offset: number;
}
@Injectable()
export class Bigfive {
  constructor(private vis: VisualizationService) {}

  public result(v: string) {
    let res: Result = {
      name: '',
      name_mn: '',
      description: '',
      color: '',
      fill: '',
      image: '',
      high: '',
      low: '',
      people1: '',
      people2: '',
      people3: '',
      people4: '',
      icon: '',
      offset: 0,
    };

    const value = v.toLowerCase();
    if (value == 'гадагшаа чиглэсэн байдал') {
      res = {
        name: 'Гадагшаа чиглэсэн байдал',
        name_mn: 'Гадагшаа чиглэсэн байдал (Экстроверт)',
        description:
          'Экстроверт буюу гадагшаа чиглэсэн хэв шинжийн хүмүүс нь ихэвчлэн яриасаг, бусадтай нээлттэй, нийтэч, хүмүүсийн дунд байх, нийгэм, олон нийтийн үйл ажиллагаанд оролцох дуртай. Тэд хүмүүсийн дунд байхдаа эрч хүчтэй, өөдрөг, өөртөө итгэлтэй байдаг. Бусад хүмүүс ч мөн адил энэ төрлийн хүмүүсийг эрч хүч, энерги ихтэй, урам зориг, тэмүүлэл өндөртэй, өөртөө итгэлтэй хүмүүс гэж харж, тодорхойлдог. Энэ хэв шинж дээр өндөр оноо авсан хүмүүс мөн сэтгэлийг нь хөдөлгөсөн, хөөргөсөн төрөл бүрийн эрсдэлтэй үйлдэл хийх, зугаа цэнгэл хайх хандлагатай байдаг.\n\nХарин энэ хэв шинж дээр бага оноо авсан хүмүүс нь эсрэгээрээ интроверт буюу дотогшоо чиглэсэн зан төрхтэй байх хандлагатай байдаг. Тэд ганцаараа эсвэл цөөхөн хүмүүстэй хамт байхыг илүүд үздэг бөгөөд олон хүн цугласан арга хэмжээнд оролцох дургүй байдаг. Бусадтай харилцах үедээ мөн харьцангуй болгоомжлосон, дуу цөөтэй байх хандлагатай.Зарим судалгаагаар экстроверт хэв шинж нь ажлын гүйцэтгэл, нийгмийн дэмжлэг зэрэг олон хүчин зүйлтэй холбоотой байж болохыг илрүүлсэн. Тухайлбал экстроверт оноо өндөртэй хүмүүс нийгмийн, хүмүүсийн харилцаа ихээр шаарддаг ажил дээр илүү амжилт гаргах магадлал их байдаг. Мөн түүнчлэн тэд илүү өргөн найз нөхөд, танилын хүрээтэй байх бөгөөд бусадтай харьцуулахад хувийн сэтгэл ханамжийн түвшин харьцангуй өндөр байдаг ажээ.',
        color: colors.steel,
        fill: colors.steel,
        image: 'gadagshaa',
        high: '• Эрч хүчтэй\n• Нийтэч\n• Жолоодох, залах\n• Адал явдлыг эрэлхийлэгч\n• Өөртөө итгэлтэй',
        low: '• Интроверт буюу дотогшоо чиглэсэн\n• Чимээгүй\n• Даруу төлөв\n• Ганцаараа цагийг өнгөрөөх дуртай',
        people1: 'Робин Уильямс (жүжигчин, комедиан)',
        people2: 'Ричард Брэнсон (Бизнесмен, Virgin Group)',
        people3: 'Майкл Скотт (The Office цувралын дүр)',
        people4: 'Г.Ганхүү (аялагч, дуучин)',
        icon: 'gadagshaa2',
        offset: 190,
      };
    }
    if (value == 'нийтэч байдал') {
      res = {
        name: 'Нөхөрсөг байдал',
        name_mn: 'Нөхөрсөг байдал',
        description:
          'Нөхөрсөг хэв шинжийн хүмүүс нь бусдад эелдэг найрсаг ханддаг, бусдын төлөө санаа тавьдаг, тусч зан төлөвтэй байдаг. Тэд бусадтай хамтран ажиллах дуртай, бусадтай аль болох нийцтэй, эв эетэй харилцаатай байхыг эрхэмлэдэг. Ерөнхийдөө энэ төрөлд багтах хүмүүс нь эмпати буюу бусдын оронд өөрийгөө тавьж, бусдын зовлон бэрхшээлийг мэдрэх, ойлгох чадвар өндөртэй. Тэд бусдад туслах, бусдын сайн сайхны төлөө ажиллах дуртай байдаг.\n\nХарин энэ хэв шинж дээр бага оноо авсан хүмүүс нь илүүтэй бусдад үл итгэсэн, болгоомжилсон байдлаар хандах, бусадтай өрсөлдөх сонирхол өндөр байдаг. Тэдний хувьд өөрийн үзэл бодлыг илэрхийлэх, үзэл санаандаа үнэнч үлдэх нь хамгийн чухал зүйл бөгөөд үүний төлөө бусад хүмүүстэй үл ойлголцол, маргаан үүсгэхээс буцахгүй. Тиймээс тэд өөрийн үзэл бодлоо шулуухан, хүчтэй илэрхийлэхээс айж эмээхгүй бөгөөд хүмүүстэй санал нэгтэй, эвтэй байхыг төдийлөн их хичээдэггүй байх хандлагатай.\n\nЗарим судлаачид нөхөрсөг хэв шинж, зан төлөвийг хүмүүсийн харилцаа, ажлын бүтээмж, сэтгэцийн эрүүл мэндтэй холбон судалсан байдаг. Дурдвал, нөхөрсөг байдлын оноо өндөртэй хүмүүс илүү их бусадтай удаан, бат бэх, эерэг харилцаа тогтоох хандлагатай бөгөөд баг, хамтын ажиллагаа шаардсан ажил төрөл хийвэл амжилт гаргах магадлал өндөр байдаг. Түүнчлэн тэд сэтгэл гутрал, сэтгэл түгшилд өртөх магадлал харьцангуй багатай, сэтгэл зүйн хувьд тогтвортой, эрүүл дадал зуршилтай байх нь элбэг. Гэхдээ нөхөрсөг хэв шинж нь үргэлж сайн үр дүнд хүргэхгүй бөгөөд энэ хэв шинж хэт их илэрсэн үед өөрийн санаа бодлоо хамгаалах чадвар харьцангуй сул байх бөгөөд бусдад хэт их дуулгавартай хандах, бусдыг хэт дагах, зэрэг сөрөг талуудтай байж болохыг анхаарах хэрэгтэй.',
        color: colors.sun,
        fill: colors.sun,
        image: 'nuhursug',
        high: '• Нөхөрсөг, хамтрагч\n• Итгэл даадаг\n• Эелдэг\n• Үнэнч, шударга\n• Бусдыг сайн ойлгогч',
        low: '• Биеэ даах чадвар өндөр\n• Шүүмжлэгч\n• Зөрүүд\n• Итгэл үнэмшилдээ үнэнч\n• Өөртөө итгэлтэй',
        people1: 'Ховард Шульц (Бизнесмен, Starbucks)',
        people2: 'Тереза эх',
        people3: 'Жэйн Гудолл',
        people4: 'Далай лам',
        people5: 'С.Зориг (улс төрч)',
        icon: 'nuhursug2',
        offset: 180,
      };
    }
    if (value == 'тогтвортой байдал') {
      res = {
        name: 'Сэтгэлийн тогтвортой байдал',
        name_mn: 'Сэтгэлийн тогтвортой байдал (Невротизм)',
        description:
          'Сэтгэлийн тогтвортой байдал (Emotional Stability) буюу мөн Невротизм (Neuroticism) гэж нэрлэгддэг энэхүү хэв шинжийн хүмүүс зан төлөв, сэтгэл зүйн хувьд ерөнхийдөө илүү тогтвортой, тэвчээртэй, уян хатан, тайван, тэнцвэртэй байдаг. Тэд сөрөг сэтгэл хөдлөлд харьцангуй бага автдаг бөгөөд эсрэгээрээ баяр хөөр, урам зориг, тэмүүлэл зэрэг эерэг сэтгэл хөдлөлүүд илүүтэй гаргадаг. \n\nСудалгаануудад дурдсанаар сэтгэлийн тогтвортой байдал нь хүний сэтгэц, оюун санааны эрүүл мэндээс эхлээд хүний бие, физиологи, бусад хүмүүстэй харилцах харилцаанд хүртэл нөлөөтэй болохыг тогтоосон. Жишээлбэл, сэтгэлийн тогтвортой байдлын оноо өндөр хүмүүст сэтгэл гутрах, сэтгэл түгших байдал харьцангуй бага ажиглагддаг. Мөн түүнчлэн бусад хүмүүстэй харьцуулахад бие физиологийн талаас зүрх судасны өвчлөлд бага өртдөг байна.\n\nХарин сэтгэлийн тогтвортой байдал дээр бага оноотой хүмүүс эсрэгээрээ сөрөг сэтгэл хөдлөлд автамтгай, уурлаж бухимдахдаа хурдан, сэтгэл гутрал, сэтгэл түгшилд өртөх эрсдэл өндөртэй байдаг. Энэ төрлийн хүмүүс ерөнхийдөө стресс, гадны цочролд хэт мэдрэг байх, хурдан хариу өгөх хандлагатай бөгөөд аливаа тулгарсан асуудал, бэрхшээлийг даван туулах, нөхцөл байдалд дасан зохицоход илүү хүндрэлтэй байж магадгүй. Мөн түүнчлэн цаашлаад согтууруулах ундаа, мансууруулах бодис хэрэглэх зэрэг эрсдэлтэй зан үйлд автагдах эрсдэл харьцангуй их байдаг.',
        color: colors.rust,
        fill: colors.rust,
        image: 'togtvor',
        high: '• Сэтгэл санааны хувьд харьцангуй тогтвортой\n• Тайван, дөлгөөн\n• Өөртөө итгэлтэй\n• Тэвчээртэй\n• Биеэ барих чадвар сайтай',
        low: '• Сэтгэл санааны хувьд тогтворгүй\n• Санаа зовомтгой\n• Цочимтгой\n• Уурлаж бухимдахдаа хурдан',
        people1: 'Сатъя Наделла (Бизнесмен, Microsoft)',
        people2: 'II Элизабет хатан хаан',
        people3: 'Махатма Ганди (улс төрч, хуульч)',
        people4: 'Бат-Эрдэнэ (бөх, дархан аварга)',
        icon: 'togtvor2',
        offset: 205,
      };
    }
    if (value == 'хариуцлагатай байдал') {
      res = {
        name: 'Хариуцлагатай байдал',
        name_mn: 'Хариуцлагатай байдал',
        description:
          'Хариуцлагатай хэв шинжид тохирох хүмүүс ихэвчлэн хичээнгүй, найдвартай, ажлыг үр бүтээлтэй хийдэг. Голдуу илрэх зан төлөвт зохион байгуулалт, дэг журам, сахилга бат сайтай, зарчимч, тэвчээртэй, тавьсан зорилгынхоо араас тууштай зүтгэх зэрэг орно.\n\nХарин хариуцлагатай байдлын оноо багатай хүмүүс эсрэгээрээ илүү тогтворгүй, эмх цэгц, хувийн зохион байгуулалт султай байх хандлагатай. Бага оноотой хүмүүсийн хувьд урдаа зорилго тавьж, тавьсан зорилгодоо хүрэхийн төлөө тууштай ажиллах, зорилгодоо хүрэх явц нь бусад хүмүүсээс илүү хэцүү төвөгтэй байх бөгөөд оронд нь өөрт нь төдийлөн чухал биш зүйлсийн араас хөөцөлдөх магадлал ихтэй.\n\nХариуцлагатай байдлыг ажлын гүйцэтгэл, эрүүл дадал зуршил, урт наслалттай холбон судалсан байдаг. Жишээлбэл, эдгээр судалгаанд хариуцлагатай хэв шинжийн оноо өндөр байх нь академик орчинд илүү их амжилт гаргахтай шууд, эерэг холбоотой, харин ажлаас халшрах, зайлсхийх, ажил тастах, (оюутан сурагчдын хувьд хичээл тастах), ажлаа солих хандлагатай эсрэгээрээ урвуу холбоотойг тогтоосон байдаг. Энэхүү хэв шинж дээр өндөр оноотой хүмүүсийн дунд дасгал хөдөлгөөн тогтмол хийх, эрүүл хоол хүнс сонгож хэрэглэх дадал зуршил түгээмэл байдгийг дурдсан байдаг. Улмаар бага оноо авсан хүнтэй харьцуулахад өндөр оноотой хүмүүс илүү урт насалдаг гэж тогтоожээ.\n\nГэхдээ хэт хариуцлагатай зан төлөв нь  зарим талаар юмыг хэт сайн, төгс хийх гэж хичээх, хэт шаргуу ажиллах, дүрэмд баригдах, нарийн жижиг зүйлс дээр хэт их цаг хугацаа, анхаарал хандуулах, бусдад болон өөртөө хэт өндөр шаардлага тавьж хатуу хандах зэрэг сөрөг үр дагаварт хүргэж болохыг анхаарах ёстой.',
        color: colors.leaf,
        fill: colors.leaf,
        image: 'hariutslaga',
        high: '• Хариуцлага өндөр\n• Итгэл даагч\n• Хувийн зохион байгуулалт сайтай\n• Нарийн жижиг зүйлстэй ажиллах дуртай',
        low: '• Уян хатан\n• Ажлаа хойш нь тавьдаг\n• Болгоомжгүй\n• Эмх цэгц муутай\n• Хувийн зохион байгуулалт муутай',
        people1: 'Ангела Меркел (улс төрч)',
        people2: 'Мари Кюри (эрдэмтэн, физикч)',
        people3: 'Жефф Безос (Бизнесмен, Amazon)',
        people4: 'Rokit Bay (дуучин)',
        icon: 'hariutslaga2',
        offset: 205,
      };
    }
    if (value == 'сониуч байдал') {
      res = {
        name: 'Сониуч байдал',
        name_mn: 'Сониуч байдал',
        description:
          'Сониуч байдал буюу мөн өөрөөр төсөөлөгч, сэтгэн бодогч гэж бас нэрлэдэг. Энэ хэв шинжид багтах буюу өндөр оноо авсан хүмүүст голдуу илрэх зан төлөвт мөрөөдөмтгий, шинийг турших дуртай, шинэ санаа санаачлагд нээлттэй хандах зэрэг орно. Ийм төрлийн хүмүүс мөн илүү бүтээлч, урлаг, гоо зүйн мэдрэмж өндөртэй байдаг. \n\nХарин энэ хэв шинж дээр оноо багатай хүмүүсийн дунд ихэвчлэн уламжлалт, хуучинсаг үзэлтэй байх, тогтвортой байдлыг эрхэмлэх хандлага ажиглагддаг. Тэдний хувьд өмнө нь туршиж үзээгүй шинэ, шинэлэг зүйлийг хийж үзэхээс илүүтэй урьдчилан таамаглах боломжтой, өөрт нь тааламжтай танил зүйлсийг хийх нь илүү тааламжтай байдаг.\n\nСудлаачид сониуч хэв шинжийг бүтээлч чанар, шинэ санаачилга, шинэ соёлыг хүлээж авах, дасан зохицох байдалтай холбон судалсан. Тухайлбал сониуч хэв шинжийн өндөр оноо бүхий хүмүүст илүү бүтээлч, шинийг санаачлах чадвар өндөр илэрдэг бөгөөд ийм  ийм ур чадвар шаарддаг ажлын байранд илүү амжилт гаргаж буйг илрүүлсэн байдаг. Мөн тэд өөр соёл, үзэл бодолд нээлттэй хандаж, шинэ орчинд дасан зохицох чадвар сайн.\n\nХэдийгээр сониуч хэв шинжийн өндөр оноог дээр дурдсан эерэг зан төрхүүдтэй холбон үздэг болов ч зарим үед сэтгэл хөдлөлдөө хэт автах, бодлогогүй түргэн үйлдлүүд гаргах, төлөвлөгөөт ажил, дэг журмыг дагаж мөрдөхийг төвөгшөөх зэрэг сөрөг үр дагавруудад хүргэж болохыг анхаарах хэрэгтэй.',
        color: colors.brown,
        fill: colors.brown,
        image: 'soniuch',
        high: '• Төсөөлөн бодох чадвар сайн\n• Сониуч\n• Шинийг туршигч\n• Эрсдэлд дуртай\n• Хийсвэр сэтгэлгээ сайн',
        low: '• Практикт суурилсан\n• Өөрчлөлтөд дургүй\n• Уламжлалт хандлагад суурилсан\n• Сонирхлын хүрээ багатай',
        people1: 'Стийв Жобс (Бизнесмен, шинийг санаачлагч, Apple)',
        people2: 'Lady Gaga (дуучин, жүжигчин)',
        people3: 'Альберт Эйнштейн (эрдэмтэн, физикч)',
        people4: 'Р.Чойном (яруу найрагч)',
        icon: 'soniuch2',
        offset: 205,
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
      doc.font(fontBold).fontSize(13).text('Оршил').moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Та өмнө нь яагаад өөрийгөө олон хүн цугласан газраас эрч хүч авдаг вэ? Эсвэл ягаад ганцаараа кофе уунгаа дуртай номоо уншиж суух нь танд илүү дулаахан таатай мэдрэмж өгдөг вэ? гэж эргэцүүлж байсан уу?\n\nЗарим хүн яагаад бүхнийг төлөвлөж байж сая нэг санаа амардаг байхад, харин зарим нь яагаад бүхнийг сүүлчийн мөчид амжуулж хийхийг илүүд үздэг юм бол?',
          marginX,
          doc.y,
          {
            align: 'justify',
          },
        );
      const imgPath = service.getAsset('icons/bigfive/main', 'jpeg');
      const imgWidth = doc.page.width - 2 * marginX;

      doc.image(imgPath, marginX, doc.y + 15, { width: imgWidth }); // adds space below image
      doc
        .font(fontNormal)
        .fontSize(12)
        .lineGap(lh.md)
        .fillColor(colors.black)
        .text(
          'Үнэндээ таны өдөр тутамдаа хийдэг эдгээр үйлдлүүд нь огт санамсаргүй тохиолдлын чанартай биш, харин үүний цаана сайтар судлагдсан сэтгэл зүйн онол, загварууд, хувь хүний төрлүүд оршин байдаг. Олон арван жилийн туршид эрдэмтэд, сэтгэл судлаачид хүний зан авир, хэл яриа, үг үйлдлүүдийг судалсны эцэст бүх хүмүүсийг дотор нь таван хэсэгт хувааж, хүний ерөнхий зан авир, шинж төрхийг нь тайлбарлах боломжтойг нээн илрүүлснээр, үндсэн 5-н хувь хүний хэв шинжийн онол (Big 5) бий болжээ. ',
          marginX,
          doc.y + 195,
          {
            align: 'justify',
          },
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
          'Үндсэн 5-н хэв шинжийн онол нь дэлхий даяар хамгийн түгээмэл хэрэглэгддэг, маш сайн судлагдаж, батлагдсан, хувь хүний зан төрхийн өвөрмөц онцлог, хэв шинжийг судлахад ашиглагддаг онол загвар юм. Сэтгэл судлаачид хүний зан төрхтэй холбоотой өвөрмөц үг, үйлдлүүдийг статистикийн аргаар нарийвчлан судалж, хоорондоо ижил төстэй байдлаар нь бүлэглэхэд, энэхүү үндсэн таван хэв шинж бүх судалгаанд дахин дахин ялгаран гарч иржээ. Эдгээр таван хэв шинж нь:',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.orange)
        .text('Гадагшаа чиглэсэн байдал (Экстроверт)');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Эрч хүчтэй, бусад хүмүүстэй хамтрах дуртай, бусдыг манлайлах, удирдах дуртай, нийгмийн идэвхтэй;',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.orange)
        .text('Нөхөрсөг байдал');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Бусдад санаа тавьдаг, эелдэг нөхөрсөг, эв нэгдлийг эрхэмлэгч, өрсөлдөөнөөс зайлсхийгч, нийцтэй таарамжтай байдлыг эрхэмлэгч;',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.orange)
        .text('Хариуцлагатай байдал');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хариуцлагатай, дэг журамтай, зарчимч, эмх цэгц, зохион байгуулалтыг эрхэмлэгч, нарийн жижиг зүйлстэй ажиллах дуртай;',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)

        .fontSize(13)
        .fillColor(colors.orange)
        .text('Сэтгэлийн тогтвортой байдал (Невротизм)');

      doc
        .font(fontNormal)

        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Амархан сэтгэл хөдөлдөг, стресст өртөхдөө амархан, сэтгэлээр унах, уурлаж бухимдахдаа хурдан;',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .fillColor(colors.orange)
        .text('Сониуч байдал');

      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Сониуч зантай, шинийг туршигч, шинэ санаа санаачилгад нээлттэй, төсөөлөн бодох чадвар өндөр, оюуны хүч шавхсан ажилд дуртай.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Эдгээр таван хэв шинжийн аль нэг нь сайн, эсвэл аль нэг нь муу гэсэн ойлголт огт байхгүй. Энэхүү сорилын гол зорилго нь таныг өөрийн өвөрмөц зан төлөвийг тодорхойлж, өөрийгөө илүү сайн, зөвөөр ойлгоход туслах юм. Одоо үндсэн 5-н хэв шинжийн сорил таны талаар юу өгүүлж буйг хамтдаа харцгаая!',
          marginX,
          doc.y,
          { align: 'justify' },
        )
        .moveDown(1);

      footer(doc);
      doc.addPage();
      header(
        doc,
        firstname,
        lastname,
        service,
        'Тестийн хэрэглээ, анхаарах зүйлс',
      );

      doc
        .font(fontBold)
        .fillColor(colors.black)
        .fontSize(12)
        .text('Хөгжүүлэлт: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Үндсэн 5-н хэв шинжийг илрүүлэх олон төрлийн тестийн хувилбаруудыг судлаач нар хөгжүүлссэн байдаг.  Бидний одоо ашиглаж буй тест нь доктор Л. Голдберг (1992)-ын боловсруулсан 50 асуулт бүхий олон улсад хамгийн түгээмэл хэрэглэгддэг, сайтар судлагдсан тестийн хувилбар юм (IPIP  BFFM).',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.font(fontBold).fontSize(12).text('Нарийвчлал: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Тестийн оноо, үр дүн нь сайн нарийвчлалтай гарах хэдий ч хэрэв таны оноо хамгийн бага эсвэл хамгийн өндөр тоон утгатай ойр байх үед тестийн нарийвчлал харьцангуйгаар багасна.',
          { align: 'justify' },
        )
        .moveDown(1);
      doc.font(fontBold).fontSize(12).text('Анхаарах: ', { continued: true });
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Уг тестийг ямар ч нөхцөлд сэтгэцийн эмгэгийн оношилгоонд ашиглаж болохгүй. Зөвхөн эмчилгээ, үйлчилгээ эрхлэх зөвшөөрөлтэй, нарийн мэргэжлийн эмч л сэтгэцийн эмгэгийг оношлоно. Тестийн үр дүнд суурилж мэргэжлийн сэтгэл зүй, сэтгэц судлалын зөвлөгөө өгөхгүй байхыг анхаарна уу!',
          { align: 'justify' },
        )
        .moveDown(1);
      doc
        .font(fontBold)
        .fontSize(13)
        .text('Тестийн оноог зөв тайлбарлах')
        .moveDown(0.5);
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Хувь хүний хэв шинж тус бүрд харгалзах тестийн оноог ойлгомжтой тайлбарлахын тулд “харьцангуй бага”, “дунд”, “харьцангуй өндөр” гэсэн гурван бүлэгт хуваасан. Онооны системийн дэлгэрэнгүй тайлбарыг доорх зургаас харна уу! ',
          { align: 'justify' },
        )
        .moveDown(0.75);
      const imgPath2 = service.getAsset('icons/bigfive/graph', 'jpeg');
      const imgWidth2 = doc.page.width - 2 * marginX;

      doc.image(imgPath2, marginX, doc.y, { width: imgWidth2 });

      const tableData = [
        ['', 'Бага', 'Дунд', 'Өндөр'],
        ['Авсан оноо', '0-23', '24-37', '38-50'],
        ['Хувь (~)', '0-33%', '34-67%', '68-100%'],
      ];

      const tableWidth = doc.page.width - 2 * marginX;
      const colWidth = tableWidth / 4;
      const rowHeight = 18;

      let startX = marginX;
      let startY = doc.y + 220;

      for (let row = 0; row < tableData.length; row++) {
        for (let col = 0; col < tableData[row].length; col++) {
          const x = startX + col * colWidth;
          const y = startY + row * rowHeight;

          doc
            .rect(x, y, colWidth, rowHeight)
            .strokeColor(colors.black)
            .stroke();

          doc
            .font(row === 0 ? fontBold : fontNormal)
            .fontSize(12)
            .fillColor('black')
            .text(tableData[row][col], x + 5, y + 4, {
              width: colWidth - 10,
              align: 'center',
            });
        }
      }
      footer(doc);
      doc.addPage();
      header(doc, firstname, lastname, service, 'Сорилын үр дүн');
      doc
        .font(fontNormal)
        .fontSize(12)
        .fillColor(colors.black)
        .text(
          'Үндсэн 5-н хэв шинж тус бүрд харгалзах дундаж оноог тооцоолж графикт үзүүлэв. Хамгийн өндөр оноо (50 оноо) бүхий хэв шинж нь таны хувь хүний үндсэн гол зан төрхийг илэрхийлж буй бол дараа дараагийн хамгийн өндөр оноо бүхий хэв шинж нь таны үг, үйлдэл, зан төрхөд хамгийн их нөлөөлж буй дараачийн хэв шинжүүдийг заана.',
          { align: 'justify' },
        );
      const details: ResultDetailEntity[] = result.details;
      const indicator = [];
      const data = [];
      const results = [];

      const max = details.reduce(
        (max, obj) => (parseInt(obj.value) > parseInt(max.value) ? obj : max),
        details[0],
      );

      for (const detail of details) {
        const result = this.result(detail.value);
        indicator.push({
          name: result.name,
          max: +max.cause,
        });
        data.push(+detail.cause);
        results.push({ ...result, point: +detail.cause, value: detail.value });
      }

      let y = doc.y;
      const pie = await this.vis.createRadar(indicator, data);
      let jpeg = await sharp(pie)
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 90, progressive: false })
        .toBuffer();
      doc.image(jpeg, 75, y + 10, {
        width: doc.page.width - 150,
      });

      doc.y += (doc.page.width / 425) * 310 - 150;
      const width = (doc.page.width / 8) * 5;
      let x = doc.x + (doc.page.width / 8) * 1.75 - marginX;

      y = doc.y + 40;
      const pointSize = (width / 20) * 7;
      const indexSize = (width / 20) * 1;
      const nameSize = (width / 20) * 12;
      doc.font(fontBold).fillColor(colors.black).text(`№`, x, y);
      doc.text('Хэв шинж', x + indexSize * 3, y);
      const pointWidth = doc.widthOfString(`Оноо`);
      doc.text(
        `Оноо`,
        x + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
        y,
      );
      doc.y += 7;
      doc
        .moveTo(x, doc.y)
        .strokeColor(colors.orange)
        .lineTo(
          x + indexSize + nameSize + pointSize / 2 + pointWidth / 2,
          doc.y,
        )
        .stroke();
      doc.y += 9;
      results.map((res, i) => {
        y = doc.y;

        const color = colors.black;

        doc
          .font(fontNormal)
          .fillColor(color)
          .text(`${i + 1}.`, x, y);
        const name = res.name;
        doc.text(name, x + indexSize * 3, y);
        const pointWidth = doc.widthOfString(`${res.point}`);
        doc.text(
          `${res.point}`,
          x + indexSize + nameSize + pointSize / 2 - pointWidth / 2,
          y,
        );
        doc.y += 5;
      });
      doc.fillColor(colors.black);
      footer(doc);
      results.forEach((res) => {
        doc.addPage();

        header(doc, firstname, lastname, service, res.name_mn);

        let category = '';
        if (res.point >= 0 && res.point <= 23) {
          category = 'Харьцангуй бага';
        } else if (res.point >= 24 && res.point <= 37) {
          category = 'Дунд';
        } else if (res.point >= 38 && res.point <= 50) {
          category = 'Харьцангуй өндөр';
        }

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text('Таны авсан оноо ', doc.x, doc.y, { continued: true });

        doc
          .font('fontBlack')
          .fontSize(16)
          .fillColor(colors.orange)
          .text(res.point.toString(), doc.x, doc.y - 3, { continued: true });

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(' буюу ', doc.x, doc.y + 3, { continued: true });

        doc
          .font('fontBlack')
          .fontSize(13)
          .fillColor(colors.orange)
          .text(category.toUpperCase(), doc.x, doc.y - 0.5, {
            continued: true,
          });

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(' байна.', doc.x, doc.y + 0.5, { continued: false })
          .moveDown(0.5);

        const tableWidth = doc.page.width - 2 * marginX;
        const colWidths = [
          tableWidth * 0.3,
          tableWidth * 0.35,
          tableWidth * 0.35,
        ];

        const rowH1 = 27;
        const rowH2 = 140;

        let posX = marginX;
        let posY = doc.y;

        const headers = ['', 'Өндөр оноотой бол', 'Бага оноотой бол'];

        headers.forEach((headerText, i) => {
          const x = posX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
          doc
            .rect(x, posY, colWidths[i], rowH1)
            .strokeColor(colors.black)
            .stroke();
          doc
            .font(fontBold)
            .fontSize(12)
            .fillColor(colors.black)
            .text(headerText, x + 10, posY + 8, {
              width: colWidths[i] - 20,
              align: 'left',
            });
        });

        posY += rowH1;

        let x = posX;

        doc.rect(x, posY, colWidths[0], rowH2).stroke();
        const imgPath = service.getAsset(`icons/bigfive/${res.image}`);
        const imgSize = Math.min(colWidths[0], rowH2);

        doc.image(imgPath, posX + 5, posY, {
          width: imgSize,
          height: imgSize,
        });

        x += colWidths[0];
        doc.rect(x, posY, colWidths[1], rowH2).stroke();
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(res.high, x + 10, posY + 10, {
            width: colWidths[1] - 20,
            align: 'left',
          });

        x += colWidths[1];
        doc.rect(x, posY, colWidths[2], rowH2).stroke();
        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(res.low, x + 10, posY + 8, {
            width: colWidths[2] - 20,
            align: 'left',
          });

        posY += rowH2 + 20;

        doc
          .font(fontNormal)
          .fontSize(12)
          .fillColor(colors.black)
          .text(res.description, marginX, posY, {
            align: 'justify',
            width: tableWidth,
          })
          .moveDown(2);

        footer(doc);
        doc.addPage();
        header(doc, firstname, lastname, service, res.name_mn);
        doc
          .font(fontBold)
          .fontSize(13)
          .fillColor(colors.black)
          .text('Энэ хэв шинжтэй тохирох олны танил хүмүүс', marginX, doc.y)
          .moveDown(0.5);
        const imgPath1 = service.getAsset(`icons/bigfive/${res.icon}`);
        const imgWidth1 = doc.page.width - 2 * marginX;

        doc.image(imgPath1, {
          width: imgWidth1,
        });
        const peopleKeys = [
          'people1',
          'people2',
          'people3',
          'people4',
          'people5',
        ];
        const peopleList = peopleKeys
          .map((k) => res[k])
          .filter((val) => val && val.trim() !== '');

        if (peopleList.length > 0) {
          const startX = marginX;
          const endX = doc.page.width - marginX;
          const totalWidth = endX - startX;

          const slotWidth = totalWidth / peopleList.length;

          let lineY = doc.y + res.offset;

          peopleList.forEach((txt, i) => {
            const x = startX + i * slotWidth;

            doc
              .font(fontNormal)
              .fontSize(12)
              .fillColor(colors.black)
              .text(txt, x, lineY, {
                width: slotWidth - 1, // add a tiny margin
                align: 'center',
                continued: false,
              });
          });
        }
        footer(doc);
      });
    } catch (error) {
      console.log('bigfive', error);
    }
  }
}
