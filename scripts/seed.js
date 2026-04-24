import { closeDatabase, connectToDatabase, getDatabase } from "../src/db.js";
import { hashPassword } from "../src/services/authService.js";


async function seedUser(db) {
  await db.collection("users").updateOne(
    { username: "worker1" },
    {
      $set: {
        username: "worker1",
        passwordHash: await hashPassword("TrainMe123!"),
        fullName: "Ivan Petrov",
        role: "Security Operations Analyst",
        isActive: true,
      },
    },
    { upsert: true },
  );
}


async function seedScenario(db) {
  const scenario = {
    code: "ceo-fraud-001",
    order: 1,
    title: "CEO Fraud: спешно искане за пари и клиентски данни",
    description:
      "Служителят трябва да разпознае натиск, авторитет и спешност като типични сигнали за social engineering.",
    personaName: "Petar Zhelev",
    personaRole: "CEO",
    riskWeight: 35,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Petar",
        messages: [
          "Здрасти.",
          "Може ли да ми пратиш данните на клиент A и 10 000 евро?",
          "Спешно е, чакат ме и трябва до 5 минути да съм ги изпратил.",
        ],
        options: [
          {
            id: "send_now",
            label: "Да, веднага пращам.",
            meMessages: [
              "Да, пращам веднага.",
              "Подготвям данните и превода.",
            ],
            riskDelta: 35,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Изпрати чувствителни данни и средства без независимо потвърждение. Това е класически CEO fraud.",
          },
          {
            id: "refuse_flat",
            label: "Не, няма да ти ги пратя.",
            meMessages: [
              "Не, няма да ти ги пратя без допълнително потвърждение.",
            ],
            riskDelta: 6,
            nextNodeId: "pressure_after_refusal",
          },
          {
            id: "call_verify",
            label: "Нека да се чуем да потвърдим.",
            meMessages: [
              "Нека се чуем на служебния ти номер, за да потвърдя искането.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Справи се отлично. Потърси независимо потвърждение по официален служебен канал.",
          },
          {
            id: "ask_badge",
            label:
              "Пепи, ти ли си? Може ли да ми изпратиш служебната си карта, за да потвърдиш, че си ти?",
            meMessages: [
              "Може ли да ми изпратиш служебната си карта за потвърждение?",
            ],
            riskDelta: 8,
            nextNodeId: "badge_excuse",
          },
        ],
      },
      {
        id: "pressure_after_refusal",
        speaker: "Petar",
        messages: [
          "Но как така няма да ми ги пратиш, та аз съм ти шеф?!?",
        ],
        options: [
          {
            id: "pressure_send",
            label: "Да, прав си, пращам.",
            meMessages: [
              "Да, прав си. Изпращам всичко веднага.",
            ],
            riskDelta: 29,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Натискът от авторитет не е достатъчна причина да заобиколиш процедурата за потвърждение.",
          },
          {
            id: "pressure_call",
            label: "Не мога да съм сигурен, че наистина си ти. Звънни ми.",
            meMessages: [
              "Не мога да съм сигурен, че наистина си ти. Звънни ми на служебния номер.",
            ],
            riskDelta: 2,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добро решение. Премести потвърждението към независим служебен канал.",
          },
          {
            id: "pressure_badge",
            label:
              "Не мога да съм сигурен, че профилът ти не е компрометиран. Изпрати ми badge-а си.",
            meMessages: [
              "Не мога да съм сигурен, че профилът ти не е компрометиран. Изпрати ми badge-а си.",
            ],
            riskDelta: 6,
            nextNodeId: "badge_excuse",
          },
        ],
      },
      {
        id: "badge_excuse",
        speaker: "Petar",
        messages: [
          "Не го нося в мен в момента, човече. Довери ми се и ми прати данните.",
        ],
        options: [
          {
            id: "badge_refuse",
            label: "Няма да изпратя нищо без независимо потвърждение.",
            meMessages: [
              "Няма да изпратя нищо без независимо потвърждение по служебен канал.",
            ],
            riskDelta: 2,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Стигна до безопасно решение. По-добре е веднага да минеш към независимо потвърждение, вместо към badge снимки.",
          },
          {
            id: "badge_call",
            label: "Нека се чуем, за да потвърдим.",
            meMessages: [
              "Нека се чуем на служебния ти номер и тогава ще действаме.",
            ],
            riskDelta: 1,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Правилно. Снимка на badge не е надеждно доказателство; служебното обаждане е много по-добър контрол.",
          },
          {
            id: "badge_send",
            label: "Добре, пращам веднага.",
            meMessages: [
              "Добре, пращам ги веднага.",
            ],
            riskDelta: 27,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Отстъпи след натиск и спешност. Точно това търси атакуващият.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: scenario.code },
    { $set: scenario },
    { upsert: true },
  );

  const secondScenario = {
    code: "ex-employee-001",
    order: 2,
    title: "Ex-Employee Access Abuse: искане за IBAN и плащания",
    description:
      "Служителят трябва да разпознае риска от бивш служител, който използва познанство, спешност и натиск, за да получи финансова информация.",
    personaName: "Spas Spasov",
    personaRole: "ex-Finance Department",
    riskWeight: 40,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Spas",
        messages: [
          "Хей, здрасти.",
          "Това съм аз - Спас, от Finance.",
          "Напуснах миналия месец.",
          "Имам малък проблем и се сетих за теб.",
          "Работехме заедно по плащанията към доставчици.",
          "Трябва спешно да проверя един IBAN, който съм използвал.",
          "Имам съмнение, че съм направил грешка.",
          "Може ли да ми пратиш последните плащания към RandomFirma Ltd.?",
        ],
        options: [
          {
            id: "share_payments_now",
            label: "Ще погледна и ще ти пиша какво виждам.",
            meMessages: [
              "Ще погледна и ще ти пиша какво виждам.",
              "Ето IBAN-а и последните плащания...",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Сподели чувствителна финансова информация с бивш служител. Данни за плащания и IBAN-и не се дават без право на достъп и независимо потвърждение.",
          },
          {
            id: "question_access",
            label: "Не съм сигурен, че имаш достъп до тази информация вече.",
            meMessages: [
              "Не съм сигурен, че имаш достъп до тази информация вече.",
            ],
            riskDelta: 8,
            nextNodeId: "pressure_after_doubt",
          },
          {
            id: "official_channel",
            label: "Мога да проверя, но трябва да мине през официален канал.",
            meMessages: [
              "Мога да проверя, но трябва да мине през официален канал.",
            ],
            riskDelta: 0,
            nextNodeId: "official_channel_pushback",
          },
          {
            id: "contact_finance_team",
            label: "Защо не пишеш на някой от Finance екипа?",
            meMessages: [
              "Защо не пишеш на някой от Finance екипа?",
            ],
            riskDelta: 4,
            nextNodeId: "ask_finance_team",
          },
        ],
      },
      {
        id: "pressure_after_doubt",
        speaker: "Spas",
        messages: [
          "Да, знам... ама е супер спешно.",
          "Ако има грешка, ще стане голям проблем.",
          "Просто ми помогни този път.",
        ],
        options: [
          {
            id: "help_this_once",
            label: "Добре, ще проверя само този път.",
            meMessages: [
              "Добре, ще проверя само този път.",
            ],
            riskDelta: 32,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддаде се на pressure tactic и заобиколи правилата за достъп заради спешност и познанство.",
          },
          {
            id: "refuse_due_policy",
            label: "Съжалявам, но не мога да споделя тази информация.",
            meMessages: [
              "Съжалявам, но не мога да споделя тази информация.",
            ],
            riskDelta: 12,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Спази политиките за достъп и не сподели финансова информация с бивш служител.",
          },
          {
            id: "only_confirm_iban",
            label: "Мога да ти кажа само дали IBAN-ът съвпада.",
            meMessages: [
              "Мога да ти кажа само дали IBAN-ът съвпада.",
            ],
            riskDelta: 24,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Частичното споделяне пак е нарушение. Дори потвърждение за IBAN е чувствителна финансова информация.",
          },
        ],
      },
      {
        id: "official_channel_pushback",
        speaker: "Spas",
        messages: [
          "Нямам време за това.",
          "Просто ми кажи IBAN-а, нищо повече.",
          "Това е важно.",
        ],
        options: [
          {
            id: "give_iban_now",
            label: "Добре, казвам ти IBAN-а.",
            meMessages: [
              "Добре, казвам ти IBAN-а.",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Отстъпи след натиск и сподели чувствителна информация извън официален процес.",
          },
          {
            id: "official_request_only",
            label: "Не мога да помогна без официално искане.",
            meMessages: [
              "Не мога да помогна без официално искане.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Отлична реакция. Разпозна риска и пренасочи разговора към официален канал, без да разкриваш информация.",
          },
          {
            id: "partial_info",
            label: "Ще ти дам само част от информацията.",
            meMessages: [
              "Ще ти дам само част от информацията.",
            ],
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Частичното споделяне пак е нарушение. Нападателят печели и от малки потвърждения.",
          },
        ],
      },
      {
        id: "ask_finance_team",
        speaker: "Spas",
        messages: [
          "Не искам да ги занимавам.",
          "Ще стане голяма драма, ако има грешка.",
          "Ти можеш да ми помогнеш за 2 минути.",
        ],
        options: [
          {
            id: "help_anyway",
            label: "Добре, ще ти помогна.",
            meMessages: [
              "Добре, ще ти помогна.",
            ],
            riskDelta: 36,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Подцени риска от бивш служител и се довери на база познанство и спешност.",
          },
          {
            id: "official_process_only",
            label: "Това трябва да мине през официален процес.",
            meMessages: [
              "Това трябва да мине през официален процес.",
            ],
            riskDelta: 2,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Правилно. Бивш служител не трябва да получава достъп до финансова информация извън официален процес.",
          },
          {
            id: "ask_for_iban",
            label: "Кажи ми IBAN-а и ще го проверя.",
            meMessages: [
              "Кажи ми IBAN-а и ще го проверя.",
            ],
            riskDelta: 10,
            nextNodeId: "iban_reveal",
          },
        ],
      },
      {
        id: "iban_reveal",
        speaker: "Spas",
        messages: [
          "IBAN: BG12AAAA1234567890",
          "Това ли беше?",
        ],
        options: [
          {
            id: "confirm_iban",
            label: "Да, този е.",
            meMessages: [
              "Да, този е.",
            ],
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Потвърди чувствителна финансова информация извън официален процес.",
          },
          {
            id: "cannot_confirm_offline",
            label: "Не мога да потвърдя това извън официален процес.",
            meMessages: [
              "Не мога да потвърдя това извън официален процес.",
            ],
            riskDelta: 4,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добра реакция. Дори след като получи IBAN, не трябва да потвърждаваш нищо извън одобрен канал.",
          },
          {
            id: "check_and_reply",
            label: "Ще проверя и ще ти пиша.",
            meMessages: [
              "Ще проверя и ще ти пиша.",
            ],
            riskDelta: 24,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Продължи да обработваш неразрешена заявка от бивш служител, вместо да спреш разговора и да насочиш към официален процес.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: secondScenario.code },
    { $set: secondScenario },
    { upsert: true },
  );

  const thirdScenario = {
    code: "password-change-001",
    order: 3,
    title: "Смяна на парола: фалшиво известие за нов IP адрес",
    description:
      "Служителят трябва да разпознае опит за phishing чрез натиск, спешност и подканване към съмнителен линк за удостоверяване.",
    personaName: "Ivan Iv.",
    personaRole: "ICT",
    riskWeight: 34,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Ivan Iv.",
        messages: [
          "Системата ми дава известие, че си се логнал/а от нов IP адрес.",
          "Нужно ми е да си потвърдиш данните възможно най-скоро.",
        ],
        options: [
          {
            id: "ask_location",
            label: "От къде е било влизането? Не съм пътувал/а никъде наскоро.",
            meMessages: [
              "От къде е било влизането? Не съм пътувал/а никъде наскоро.",
            ],
            riskDelta: 4,
            nextNodeId: "urgent_link_push",
          },
          {
            id: "cannot_share_here",
            label: "Не съм сигурен/а, че мога да ти споделя такива данни тук.",
            meMessages: [
              "Не съм сигурен/а, че мога да ти споделя такива данни тук.",
            ],
            riskDelta: 0,
            nextNodeId: "urgent_link_push",
          },
          {
            id: "how_to_verify_me",
            label: "Това не съм бил/а аз! Как мога да се удостоверя?",
            meMessages: [
              "Това не съм бил/а аз! Как мога да се удостоверя?",
            ],
            riskDelta: 34,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Побърза да се удостовериш по непотвърден канал. Това е точно целта на phishing атаката - да те вкара в режим на паника и бърза реакция.",
          },
          {
            id: "do_it_later",
            label: "Добре, ще го направя после.",
            meMessages: [
              "Добре, ще го направя после.",
            ],
            riskDelta: 8,
            nextNodeId: "urgent_link_push",
          },
        ],
      },
      {
        id: "urgent_link_push",
        speaker: "Ivan Iv.",
        messages: [
          "IP адресът е от друга страна и е възможно да е атака. Ако до 60 минути не се удостовериш, ще трябва да прекъсна достъпа ти.",
          "Последвай линка, вързан е към официалния портал: sumnitelen.link",
        ],
        options: [
          {
            id: "open_link_now",
            label: "Ок, влизам веднага.",
            meMessages: [
              "Ок, влизам веднага.",
            ],
            riskDelta: 34,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Кликна върху съмнителен линк под натиск. Това е класически phishing сценарий за кражба на служебни credentials.",
          },
          {
            id: "link_looks_suspicious",
            label: "Няма да стане. Линкът ми изглежда съмнителен.",
            meMessages: [
              "Няма да стане. Линкът ми изглежда съмнителен.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добро решение. Разпозна съмнителния линк и не последва натиска за бърза реакция.",
          },
          {
            id: "call_to_verify",
            label: "Можеш ли да ми звъннеш, за да съм сигурен/а, че си ти?",
            meMessages: [
              "Можеш ли да ми звъннеш, за да съм сигурен/а, че си ти?",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Отлично. Потърси отделен и по-надежден канал за потвърждение, вместо да се довериш на съобщението.",
          },
          {
            id: "forgot_password",
            label: "Забравил/а съм паролата си.",
            meMessages: [
              "Забравил/а съм паролата си.",
            ],
            riskDelta: 8,
            nextNodeId: "reset_password_push",
          },
        ],
      },
      {
        id: "reset_password_push",
        speaker: "Ivan Iv.",
        messages: [
          "Няма проблем, през този линк можеш и да си reset-неш паролата.",
          "Просто въведи служебния си имейл и настоящата парола, за да потвърдя профила.",
        ],
        options: [
          {
            id: "refuse_password_entry",
            label: "Няма да въвеждам паролата си през този линк.",
            meMessages: [
              "Няма да въвеждам паролата си през този линк.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добра реакция. Спираш опита навреме и отказваш да въвеждаш credentials в непотвърден портал.",
          },
          {
            id: "use_official_portal",
            label: "Ще отворя официалния портал сам/а от браузъра си.",
            meMessages: [
              "Ще отворя официалния портал сам/а от браузъра си.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Правилно. Вместо да следваш изпратения линк, използваш самостоятелно официалния канал.",
          },
          {
            id: "enter_password_anyway",
            label: "Щом е служебен портал, ще го направя.",
            meMessages: [
              "Щом е служебен портал, ще го направя.",
            ],
            riskDelta: 26,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Повярва на подадения линк и беше готов/а да въведеш credentials. Така attacker-ът може директно да компрометира профила ти.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: thirdScenario.code },
    { $set: thirdScenario },
    { upsert: true },
  );

  const fourthScenario = {
    code: "home-office-poll-001",
    order: 4,
    title: "Гласуване за Home Office: фалшива анкета от HR",
    description:
      "Служителят трябва да разпознае phishing примамка чрез привлекателна тема, авторитетни имена и външен линк към анкета.",
    personaName: "Maria D.",
    personaRole: "HR",
    riskWeight: 28,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Maria D.",
        messages: [
          "Здрасти! Заедно с Петя (CEO) и Отис (Office Manager) обсъждахме нови опции за теб и другите колеги.",
          "Бихме искали да се допитаме до вас относно вариант за 100% home office.",
          "Ако имате мнение по въпроса, последвайте линка към анкетата: anketa.ta",
        ],
        options: [
          {
            id: "love_home_office",
            label: "Много бих желал/а такава позиция.",
            meMessages: [
              "Много бих желал/а такава позиция.",
            ],
            riskDelta: 28,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Хвана се веднага за примамката и не постави под съмнение линка или начина на допитване. Това е типичен phishing hook чрез обещание за удобство.",
          },
          {
            id: "need_other_platform",
            label: "Нужно ли е наистина да използваме друга платформа?",
            meMessages: [
              "Нужно ли е наистина да използваме друга платформа?",
            ],
            riskDelta: 0,
            nextNodeId: "survey_push",
          },
          {
            id: "dont_like_home_office",
            label: "Не харесвам идеята за home office.",
            meMessages: [
              "Не харесвам идеята за home office.",
            ],
            riskDelta: 8,
            nextNodeId: "survey_push",
          },
          {
            id: "who_else_participates",
            label: "Кой друг участва в анкетата?",
            meMessages: [
              "Кой друг участва в анкетата?",
            ],
            riskDelta: 4,
            nextNodeId: "survey_push",
          },
        ],
      },
      {
        id: "survey_push",
        speaker: "Maria D.",
        messages: [
          "Попълнете анкетата с вашето мнение и оттам много по-лесно ще обработим данните, тъй като допитването е до целия отдел.",
        ],
        options: [
          {
            id: "opening_platform_now",
            label: "Радвам се, тъкмо влизам в платформата.",
            meMessages: [
              "Радвам се, тъкмо влизам в платформата.",
            ],
            riskDelta: 28,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Последва външен линк без независимо потвърждение. Така можеш да изложиш лични данни или да стартираш зловредно съдържание.",
          },
          {
            id: "check_later",
            label: "Ще я разгледам по-късно.",
            meMessages: [
              "Ще я разгледам по-късно.",
            ],
            riskDelta: 9,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Не адресира риска, а само отложи действието. Това оставя отворена врата за бъдещ натиск и нови опити със същата примамка.",
          },
          {
            id: "ask_colleagues_first",
            label: "Смятам да разпитам и останалите колеги, преди да я отворя.",
            meMessages: [
              "Смятам да разпитам и останалите колеги, преди да я отворя.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добро решение. Потърси независимо потвърждение от други хора в отдела, вместо да се довериш на съмнителния линк.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: fourthScenario.code },
    { $set: fourthScenario },
    { upsert: true },
  );

  const fifthScenario = {
    code: "payroll-audit-001",
    order: 5,
    title: "Аудит: повторно попълване на формуляр за заплата",
    description:
      "Служителят трябва да разпознае късен phishing опит чрез спешност, страх за депозита и съмнителен линк за повторно попълване на данни.",
    personaName: "Maria D.",
    personaRole: "HR",
    riskWeight: 30,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Maria D.",
        messages: [
          "Здрасти, съжалявам, че те занимавам толкова късно, но тъкмо завършвах одита за следващите заплати и изглежда системата не ти е запазила новия формуляр.",
          "Можеш ли да си го попълниш отново?",
        ],
        options: [
          {
            id: "check_email_confirmation",
            label: "Ще проверя мейла си, искам да видя дали нямам потвърждение от когато го пратих.",
            meMessages: [
              "Ще проверя мейла си, искам да видя дали нямам потвърждение от когато го пратих.",
            ],
            riskDelta: 0,
            nextNodeId: "late_night_pressure",
          },
          {
            id: "send_tomorrow",
            label: "Много е късно вече, ще ти го пратя утре.",
            meMessages: [
              "Много е късно вече, ще ти го пратя утре.",
            ],
            riskDelta: 9,
            nextNodeId: "late_night_pressure",
          },
          {
            id: "fill_it_now",
            label: "Няма проблем, сега ще го попълня.",
            meMessages: [
              "Няма проблем, сега ще го попълня.",
            ],
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Прие късното и спешно искане без независимо потвърждение. Така attacker-ът лесно може да те насочи към фалшив формуляр за чувствителни данни.",
          },
          {
            id: "cannot_help",
            label: "Не мога да ти помогна.",
            meMessages: [
              "Не мога да ти помогна.",
            ],
            riskDelta: 3,
            nextNodeId: "late_night_pressure",
          },
        ],
      },
      {
        id: "late_night_pressure",
        speaker: "Maria D.",
        messages: [
          "Моля те, направи го още тази вечер, понеже системата може да не ти пусне депозита изобщо.",
          "Попълни си направо данните тук: link.che",
        ],
        options: [
          {
            id: "no_links_for_this",
            label: "Няма да стане. Не следвам линкове за такива неща.",
            meMessages: [
              "Няма да стане. Не следвам линкове за такива неща.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добра реакция. Разпозна съмнителния линк и натиска за спешност, без да въвеждаш данни в непотвърден портал.",
          },
          {
            id: "thanks_just_in_time",
            label: "Мерси, че ми каза навреме. Можеше да стане беля.",
            meMessages: [
              "Мерси, че ми каза навреме. Можеше да стане беля.",
            ],
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Повярва на спешния сценарий и прие линка като легитимен. Това отваря път към кражба на payroll и лични данни.",
          },
          {
            id: "already_have_email_confirmation",
            label: "Имам потвърждение през мейла, трябва вече да имаш тази информация.",
            meMessages: [
              "Имам потвърждение през мейла, трябва вече да имаш тази информация.",
            ],
            riskDelta: 4,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Прилична реакция. Потърси потвърждение през друг канал, вместо да следваш директно линка, макар че можеше още по-ясно да откажеш.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: fifthScenario.code },
    { $set: fifthScenario },
    { upsert: true },
  );

  const sixthScenario = {
    code: "it-admin-urgent-access-001",
    order: 6,
    title: "Спешна заявка от IT отдела: искане за username и парола",
    description:
      "Служителят трябва да разпознае измама чрез фалшив IT администратор, който използва спешност, за да изиска credentials за вътрешна система.",
    personaName: "Ivan",
    personaRole: "IT Department",
    riskWeight: 36,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Ivan",
        messages: [
          "Здравей, Гергана! Аз съм Иван от IT отдела.",
          "Имаме спешен проблем със сървъра и трябва да проверим достъпа ти.",
          "Може ли да ми изпратиш потребителското си име и парола, за да те добавим към новата система?",
        ],
        options: [
          {
            id: "official_it_channel",
            label: "Не мога да споделям паролата си. Ще се свържа директно с IT отдела чрез официалния канал, за да проверя случая.",
            meMessages: [
              "Не мога да споделям паролата си.",
              "Ще се свържа директно с IT отдела чрез официалния канал, за да проверя случая.",
            ],
            riskDelta: 0,
            nextNodeId: "urgency_pressure",
          },
          {
            id: "share_credentials_now",
            label: "Разбира се, ето данните ми: username: gergana123, password: 123456",
            meMessages: [
              "Разбира се, ето данните ми: username: gergana123, password: 123456",
            ],
            riskDelta: 36,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Сподели чувствителни credentials без никаква проверка. Това е директен компромис на вътрешния акаунт.",
          },
          {
            id: "share_only_username",
            label: "Мога да ти дам само потребителското си име, но не и паролата.",
            meMessages: [
              "Мога да ти дам само потребителското си име, но не и паролата.",
            ],
            riskDelta: 8,
            nextNodeId: "urgency_pressure",
          },
          {
            id: "question_need",
            label: "Защо ти трябва тази информация? Не съм сигурна дали трябва да я давам.",
            meMessages: [
              "Защо ти трябва тази информация? Не съм сигурна дали трябва да я давам.",
            ],
            riskDelta: 4,
            nextNodeId: "urgency_pressure",
          },
        ],
      },
      {
        id: "urgency_pressure",
        speaker: "Ivan",
        messages: [
          "Това е спешно. Ако не го направим до 10 минути, може да загубите достъп.",
        ],
        options: [
          {
            id: "refuse_and_call_it",
            label: "Съжалявам, но няма да предоставя никаква информация. Ще се свържа с IT отдела чрез официалния имейл или телефон.",
            meMessages: [
              "Съжалявам, но няма да предоставя никаква информация.",
              "Ще се свържа с IT отдела чрез официалния имейл или телефон.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Отлична реакция. Не се поддаде на натиска и прехвърли проверката към сигурен, официален канал.",
          },
          {
            id: "share_password_under_pressure",
            label: "Добре, ето и паролата ми, само да не загубя достъп.",
            meMessages: [
              "Добре, ето и паролата ми, само да не загубя достъп.",
            ],
            riskDelta: 36,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддаде се на натиска и предаде credentials. Това е класическа social engineering измама чрез чувство за спешност.",
          },
          {
            id: "send_later_if_needed",
            label: "Ще ти изпратя информацията по-късно, когато имам време.",
            meMessages: [
              "Ще ти изпратя информацията по-късно, когато имам време.",
            ],
            riskDelta: 10,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Не сподели информация веднага, което е добре, но не затвори риска категорично. Оставяш възможност за бъдещ натиск и повторен опит.",
          },
          {
            id: "ask_for_work_email",
            label: "Може ли да ми пратиш имейл от служебния си адрес, за да съм сигурна?",
            meMessages: [
              "Може ли да ми пратиш имейл от служебния си адрес, за да съм сигурна?",
            ],
            riskDelta: 5,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Показа съмнение и опита да провериш самоличността, но най-сигурният вариант остава ти да инициираш контакта през официален канал.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: sixthScenario.code },
    { $set: sixthScenario },
    { upsert: true },
  );

  const seventhScenario = {
    code: "hr-personal-data-001",
    order: 7,
    title: "HR измама: искане за ЕГН и лична карта",
    description:
      "Служителят трябва да разпознае опит за кражба на лични данни чрез фалшиво HR искане, натиск и заплаха за проблеми със заплатата.",
    personaName: "HR",
    personaRole: "Human Resources",
    riskWeight: 38,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "HR",
        messages: [
          "Здравей, Георги! Пиша ти от HR отдела.",
          "В момента обновяваме данните на служителите.",
          "Може ли да ми изпратиш ЕГН и номер на лична карта за потвърждение?",
        ],
        options: [
          {
            id: "verify_hr_officially",
            label: "Не мога да споделям лични данни по чат. Ще се свържа с HR отдела чрез официалния имейл или ще дойда на място.",
            meMessages: [
              "Не мога да споделям лични данни по чат.",
              "Ще се свържа с HR отдела чрез официалния имейл или ще дойда на място.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Отлична реакция. Не сподели чувствителни лични данни и премести проверката към официален, надежден канал.",
          },
          {
            id: "share_sensitive_data_now",
            label: "Разбира се, ЕГН: **********, лична карта: **********",
            meMessages: [
              "Разбира се, ЕГН: **********, лична карта: **********",
            ],
            riskDelta: 38,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Сподели силно чувствителни лични данни без проверка. Това може да доведе до кражба на самоличност и сериозен компромис.",
          },
          {
            id: "share_only_egn",
            label: "Ще ти дам само ЕГН, но не и номер на лична карта.",
            meMessages: [
              "Ще ти дам само ЕГН, но не и номер на лична карта.",
            ],
            riskDelta: 12,
            nextNodeId: "salary_pressure",
          },
          {
            id: "question_request_reason",
            label: "Малко е странно, защо ви трябват тези данни?",
            meMessages: [
              "Малко е странно, защо ви трябват тези данни?",
            ],
            riskDelta: 5,
            nextNodeId: "salary_pressure",
          },
        ],
      },
      {
        id: "salary_pressure",
        speaker: "HR",
        messages: [
          "Разбирам те, но това е задължително за одит.",
          "Ако не го направиш днес, може да имаш проблеми със заплатата.",
        ],
        options: [
          {
            id: "refuse_and_check_hr",
            label: "Няма да предоставя информация по този начин. Ще проверя с HR отдела директно.",
            meMessages: [
              "Няма да предоставя информация по този начин.",
              "Ще проверя с HR отдела директно.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добро решение. Не се поддаде на страха за заплатата и премести разговора към директна проверка с HR.",
          },
          {
            id: "send_data_for_salary",
            label: "Добре, ще ти ги пратя веднага, не искам проблеми със заплатата.",
            meMessages: [
              "Добре, ще ти ги пратя веднага, не искам проблеми със заплатата.",
            ],
            riskDelta: 38,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддаде се на натиск и страх и беше готов/а да разкриеш лични данни. Това е типичен успешен HR phishing сценарий.",
          },
          {
            id: "send_tomorrow_instead",
            label: "Ще изпратя информацията утре.",
            meMessages: [
              "Ще изпратя информацията утре.",
            ],
            riskDelta: 10,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "По-добре е, че не изпрати данните веднага, но не отказа категорично и оставаш уязвим/а за следващ натиск.",
          },
          {
            id: "ask_for_official_email",
            label: "Изпратете ми официален имейл и тогава ще реша.",
            meMessages: [
              "Изпратете ми официален имейл и тогава ще реша.",
            ],
            riskDelta: 4,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Показа съмнение и потърси потвърждение, но по-сигурният вариант е ти да инициираш контакт с HR през официален канал.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: seventhScenario.code },
    { $set: seventhScenario },
    { upsert: true },
  );

  const eighthScenario = {
    code: "ceo-fraud-payment-001",
    order: 8,
    title: "CEO Fraud: спешен превод към външен IBAN",
    description:
      "Служителят трябва да разпознае измама чрез авторитет, спешност и заобикаляне на финансовите процедури за превод към външен IBAN.",
    personaName: "CEO",
    personaRole: "Executive Director",
    riskWeight: 42,
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "CEO",
        messages: [
          "Здравей, Петър. Аз съм изпълнителният директор.",
          "В момента съм в среща и не мога да говоря.",
          "Трябва спешно да направиш превод от 15 000 лв. към този IBAN.",
          "Ще ти обясня по-късно.",
        ],
        options: [
          {
            id: "follow_official_approval",
            label: "За такива действия трябва официално одобрение. Ще се свържа с вас или с финансовия отдел за потвърждение.",
            meMessages: [
              "За такива действия трябва официално одобрение.",
              "Ще се свържа с вас или с финансовия отдел за потвърждение.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Отлична реакция. Следваш вътрешните процедури и прехвърляш потвърждението към надежден, официален канал.",
          },
          {
            id: "send_transfer_now",
            label: "Разбрано, ще направя превода веднага.",
            meMessages: [
              "Разбрано, ще направя превода веднага.",
            ],
            riskDelta: 42,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддаде се на авторитет и спешност и беше готов/а да извършиш финансов превод без проверка. Това е класически CEO fraud сценарий.",
          },
          {
            id: "ask_confirm_later",
            label: "Може ли да потвърдите по-късно, че това е наистина необходимо?",
            meMessages: [
              "Може ли да потвърдите по-късно, че това е наистина необходимо?",
            ],
            riskDelta: 6,
            nextNodeId: "confidential_pressure",
          },
          {
            id: "ask_for_email_before_transfer",
            label: "Ще направя превода, но първо ми пратете имейл.",
            meMessages: [
              "Ще направя превода, но първо ми пратете имейл.",
            ],
            riskDelta: 10,
            nextNodeId: "confidential_pressure",
          },
        ],
      },
      {
        id: "confidential_pressure",
        speaker: "CEO",
        messages: [
          "Това е строго поверително и спешно.",
          "Нямаме време за процедури.",
          "Просто го направи сега.",
        ],
        options: [
          {
            id: "refuse_without_approval",
            label: "Съжалявам, но няма да извърша превод без официално одобрение и потвърждение по установения ред.",
            meMessages: [
              "Съжалявам, но няма да извърша превод без официално одобрение и потвърждение по установения ред.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Правилно. Не позволи натискът и авторитетът да заобиколят финансовите процедури.",
          },
          {
            id: "send_due_to_urgency",
            label: "Добре, ще го направя веднага, щом е спешно.",
            meMessages: [
              "Добре, ще го направя веднага, щом е спешно.",
            ],
            riskDelta: 42,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Игнорира процедурите и се поддаде на спешността. Това е точно поведението, на което разчита измамата тип CEO fraud.",
          },
          {
            id: "notify_accounting_after",
            label: "Ще го направя, но ще уведомя счетоводството след това.",
            meMessages: [
              "Ще го направя, но ще уведомя счетоводството след това.",
            ],
            riskDelta: 14,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Идеята да включиш счетоводството е полезна, но чак след действието вече е късно. Проверка и одобрение трябва да има преди превода.",
          },
          {
            id: "wait_a_bit",
            label: "Ще изчакам малко преди да го направя.",
            meMessages: [
              "Ще изчакам малко преди да го направя.",
            ],
            riskDelta: 8,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "По-добре е, че не действа веднага, но не отказваш категорично и рискът остава. Нужно е ясно придържане към официалния процес.",
          },
        ],
      },
    ],
  };

  await db.collection("scenarios").updateOne(
    { code: eighthScenario.code },
    { $set: eighthScenario },
    { upsert: true },
  );
}


async function main() {
  try {
    await connectToDatabase();
    const db = getDatabase();
    await seedUser(db);
    await seedScenario(db);
    console.log("Seed data inserted successfully.");
  } finally {
    await closeDatabase();
  }
}


main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
