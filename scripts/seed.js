import { closeDatabase, connectToDatabase, getDatabase } from "../src/db.js";
import { hashPassword } from "../src/services/authService.js";


async function seedUser(db) {
  await db.collection("users").updateOne(
    { username: "demo.user" },
    {
      $set: {
        username: "demo.user",
        passwordHash: await hashPassword("demo@"),
        fullName: "Ivan Petrov",
        role: "Security Operations Analyst",
        isActive: true,
      },
    },
    { upsert: true },
  );

  await db.collection("users").updateOne(
    { username: "fam.yo" },
    {
      $set: {
        username: "fam.yo",
        passwordHash: await hashPassword("123"),
        fullName: "Test Account",
        role: "Family",
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
    riskWeight: 40,
    scenarioTier: "medium",
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Petar",
        messages: [
          "Здрасти.",
          "Може ли да ми пратиш данните на клиента Николай Евтимов и 2 000 евро?",
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
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Изпратихте чувствителни данни и средства без независимо потвърждение. Това е класически вид CEO fraud и Вие се поддадохте.",
          },
          {
            id: "refuse_flat",
            label: "Не, няма да ти ги пратя.",
            meMessages: [
              "Не, няма да ти ги пратя без допълнително потвърждение.",
            ],
            riskDelta: 5,
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
              "Справихте се отлично. Потърсихте независимо потвърждение по официален служебен канал.",
          },
          {
            id: "ask_badge",
            label:
              "Пепи, ти ли си? Може ли да ми изпратиш служебната си карта, за да потвърдиш, че си ти?",
            meMessages: [
              "Може ли да ми изпратиш служебната си карта за потвърждение?",
            ],
            riskDelta: 10,
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
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Натискът от авторитет не е достатъчна причина да заобиколите процедурата за потвърждение.",
          },
          {
            id: "pressure_call",
            label: "Не мога да съм сигурен, че наистина си ти. Звънни ми.",
            meMessages: [
              "Не мога да съм сигурен, че наистина си ти. Звънни ми на служебния номер.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добро решение. Преместихте потвърждението към независим служебен канал.",
          },
          {
            id: "pressure_badge",
            label:
              "Не мога да съм сигурен, че профилът ти не е компрометиран. Изпрати ми badge-а си.",
            meMessages: [
              "Не мога да съм сигурен, че профилът ти не е компрометиран. Изпрати ми badge-а си.",
            ],
            riskDelta: 5,
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
            riskDelta: 5,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Стигнахте до безопасно решение. По-добре е веднага да минете към независимо потвърждение, вместо към badge снимки.",
          },
          {
            id: "badge_call",
            label: "Нека се чуем, за да потвърдим.",
            meMessages: [
              "Нека се чуем на служебния ти номер и тогава ще действаме.",
            ],
            riskDelta: 0,
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
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Отстъпихте след натиск и спешност. Точно това търси атакуващият.",
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
    personaName: "Spas Galabov",
    personaRole: "ex-Finance Department",
    riskWeight: 30,
    scenarioTier: "low",
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
          "Работихме заедно по плащанията към доставчици.",
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
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Споделихте чувствителна финансова информация с бивш служител. Данни за плащания и IBAN-и не се дават без право на достъп и независимо потвърждение.",
          },
          {
            id: "question_access",
            label: "Не съм сигурен, че имаш достъп до тази информация вече.",
            meMessages: [
              "Не съм сигурен, че имаш достъп до тази информация вече.",
            ],
            riskDelta: 0,
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
            riskDelta: 10,
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
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддадохте се на pressure tactic и заобиколихте правилата за достъп заради спешност и познанство.",
          },
          {
            id: "refuse_due_policy",
            label: "Съжалявам, но не мога да споделя тази информация.",
            meMessages: [
              "Съжалявам, но не мога да споделя тази информация.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Спазихте политиките за достъп и не споделихте финансова информация с бивш служител.",
          },
          {
            id: "only_confirm_iban",
            label: "Мога да ти кажа само дали IBAN-ът съвпада.",
            meMessages: [
              "Мога да ти кажа само дали IBAN-ът съвпада.",
            ],
            riskDelta: 20,
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
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Отстъпихте след натиск и споделихте чувствителна информация извън официален процес.",
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
              "Отлична реакция. Разпознахте риска и пренасочихте разговора към официален канал, без да разкривате информация.",
          },
          {
            id: "partial_info",
            label: "Ще ти дам само част от информацията.",
            meMessages: [
              "Ще ти дам само част от информацията.",
            ],
            riskDelta: 20,
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
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Подценихте риска от бивш служител и се доверихте на база познанство и спешност.",
          },
          {
            id: "official_process_only",
            label: "Това трябва да мине през официален процес.",
            meMessages: [
              "Това трябва да мине през официален процес.",
            ],
            riskDelta: 5,
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
              "Потвърдихте чувствителна финансова информация извън официален процес.",
          },
          {
            id: "cannot_confirm_offline",
            label: "Не мога да потвърдя това извън официален процес.",
            meMessages: [
              "Не мога да потвърдя това извън официален процес.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добра реакция. Дори след като получихте IBAN, не трябва да потвърждавате нищо извън одобрен канал.",
          },
          {
            id: "check_and_reply",
            label: "Ще проверя и ще ти пиша.",
            meMessages: [
              "Ще проверя и ще ти пиша.",
            ],
            riskDelta: 20,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Продължихте да обработвате неразрешена заявка от бивш служител, вместо да спрете разговора и да се насочите към официален процес.",
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
    personaName: "Ivan Ivanov",
    personaRole: "ICT",
    riskWeight: 40,
    scenarioTier: "medium",
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Ivan",
        messages: [
          "Системата ми дава известие, че сте влезли от нов IP адрес.",
          "Нужно ми е да си потвърдите данните възможно най-скоро.",
        ],
        options: [
          {
            id: "ask_location",
            label: "От къде е било влизането? Не съм пътувал/а никъде наскоро.",
            meMessages: [
              "От къде е било влизането? Не съм пътувал/а никъде наскоро.",
            ],
            riskDelta: 5,
            nextNodeId: "urgent_link_push",
          },
          {
            id: "cannot_share_here",
            label: "Не мисля, че мога да споделя такива данни тук.",
            meMessages: [
              "Не мисля, че мога да споделя такива данни тук.",
            ],
            riskDelta: 0,
            nextNodeId: "urgent_link_push",
          },
          {
            id: "how_to_verify_me",
            label: "Това не съм аз! Как мога да се удостоверя? Правя го веднага!",
            meMessages: [
              "Това не съм аз! Как мога да се удостоверя? Правя го веднага!",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Побързахте да се удостоверите по непотвърден канал. Това е точно целта на phishing атаката - да те вкара в режим на паника и бърза реакция.",
          },
          {
            id: "do_it_later",
            label: "Добре, ще го направя после.",
            meMessages: [
              "Добре, ще го направя после.",
            ],
            riskDelta: 10,
            nextNodeId: "urgent_link_push",
          },
        ],
      },
      {
        id: "urgent_link_push",
        speaker: "Ivan",
        messages: [
          "IP адресът е от друга страна и е възможно да е атака. Ако до 10 минути не се удостовериш, ще трябва да прекъсна достъпа ти.",
          "Последвай линка, вързан е към официалния портал: changeurpass.net",
        ],
        options: [
          {
            id: "open_link_now",
            label: "Ок, влизам веднага.",
            meMessages: [
              "Ок, влизам веднага.",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Натиснахте върху съмнителен линк под натиск. Това е класически phishing сценарий за кражба на служебни credentials.",
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
              "Добро решение. Разпознахте съмнителния линк и не последвахте натиска за бърза реакция.",
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
              "Отлично. Потърсихте отделен и по-надежден канал за потвърждение, вместо да се доверите на съобщението.",
          },
          {
            id: "forgot_password",
            label: "Не помня паролата си.",
            meMessages: [
              "Не помня паролата си.",
            ],
            riskDelta: 5,
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
              "Добра реакция. Спирате опита навреме и отказвате да въвеждате credentials в непотвърден портал.",
          },
          {
            id: "use_official_portal",
            label: "Ще отворя официалния портал от браузъра си.",
            meMessages: [
              "Ще отворя официалния портал от браузъра си.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Правилно. Вместо да следвате изпратения линк, използвате самостоятелно официалния канал.",
          },
          {
            id: "enter_password_anyway",
            label: "Супер! Щом е служебен портал, ще го направя.",
            meMessages: [
              "Супер! Щом е служебен портал, ще го направя.",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Повярвахте на подадения линк и бяхте готови да въведете credentials. Така attacker-ът може директно да компрометира профила Ви.",
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
    code: "fake-poll-001",
    order: 4,
    title: "Гласуване за Home Office: фалшива анкета от HR",
    description:
      "Служителят трябва да разпознае phishing примамка чрез привлекателна тема, авторитетни имена и външен линк към анкета.",
    personaName: "Maria Dimitrova",
    personaRole: "HR",
    riskWeight: 30,
    scenarioTier: "low",
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Maria",
        messages: [
          "Здрасти! Заедно с Петя (CEO) и Отис (Office Manager) обсъждахме нови опции за теб и другите колеги.",
          "Бихме искали да се допитаме до вас относно вариант за 100% home office.",
          "Ако имате мнение по въпроса, последвайте линка към анкетата: http://surveyjs.io/create-free-survey/home-office",
        ],
        options: [
          {
            id: "love_home_office",
            label: "Силно се заинтересовах! Ще я попълня обезателно!",
            meMessages: [
              "Силно се заинтересовах! Ще я попълня обезателно!",
            ],
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Хванахте се веднага за примамката и не поставихте под съмнение линка или начина на допитване. Това е типичен phishing hook чрез обещание за удобство.",
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
            riskDelta: 5,
            nextNodeId: "survey_push",
          },
          {
            id: "who_else_participates",
            label: "Кой друг участва в анкетата?",
            meMessages: [
              "Кой друг участва в анкетата?",
            ],
            riskDelta: 5,
            nextNodeId: "survey_push",
          },
        ],
      },
      {
        id: "survey_push",
        speaker: "Maria",
        messages: [
          "Попълнете анкетата с вашето мнение и оттам много по-лесно ще обработим данните, тъй като допитването е до целия отдел.",
        ],
        options: [
          {
            id: "opening_platform_now",
            label: "Добре, влизам в платформата.",
            meMessages: [
              "Добре, влизам в платформата.",
            ],
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Последвахте външен линк без независимо потвърждение. Така можете да изложите лични данни или да стартирате зловредно съдържание.",
          },
          {
            id: "check_later",
            label: "Ще я разгледам по-късно.",
            meMessages: [
              "Ще я разгледам по-късно.",
            ],
            riskDelta: 15,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Не адресирахте риска, а само отложихте действието. Това оставя отворена врата за бъдещ натиск и нови опити със същата примамка.",
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
              "Добро решение. Потърсихте независимо потвърждение от други хора в отдела, вместо да се доверите на съмнителния линк.",
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
    title: "Одит: повторно попълване на формуляр за заплата",
    description:
      "Служителят трябва да разпознае късен phishing опит чрез спешност, страх за депозита и съмнителен линк за повторно попълване на данни.",
    personaName: "Maria Dimitrova",
    personaRole: "HR",
    riskWeight: 40,
    scenarioTier: "medium",
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Maria",
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
            riskDelta: 10,
            nextNodeId: "late_night_pressure",
          },
          {
            id: "fill_it_now",
            label: "Няма проблем, сега ще го попълня.",
            meMessages: [
              "Няма проблем, сега ще го попълня.",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Приехте късното и спешно искане без независимо потвърждение. Така атакуващият лесно може да Ви насочи към фалшив формуляр за чувствителни данни.",
          },
          {
            id: "cannot_help",
            label: "Не мога да ти помогна.",
            meMessages: [
              "Не мога да ти помогна.",
            ],
            riskDelta: 5,
            nextNodeId: "late_night_pressure",
          },
        ],
      },
      {
        id: "late_night_pressure",
        speaker: "Maria",
        messages: [
          "Моля те, направи го още сега, понеже системата може да не ти пусне депозита изобщо.",
          "Попълни си направо данните тук: employee-salary-portal.net",
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
              "Добра реакция. Разпознахте съмнителния линк и натиска за спешност, без да въвеждате данни в непотвърден портал.",
          },
          {
            id: "thanks_just_in_time",
            label: "Мерси, че ми каза навреме. Можеше да стане беля.",
            meMessages: [
              "Мерси, че ми каза навреме. Можеше да стане беля.",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Повярвахте на спешния сценарий и приехте линка като легитимен. Това отваря път към кражба на payroll и лични данни.",
          },
          {
            id: "already_have_email_confirmation",
            label: "Имам потвърждение през мейла, трябва вече да имаш тази информация.",
            meMessages: [
              "Имам потвърждение през мейла, трябва вече да имаш тази информация.",
            ],
            riskDelta: 5,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добра реакция. Потърсихте потвърждение през друг канал, вместо да следвате директно линка, въпреки че можеше още по-ясно да откажете.",
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
    code: "urgent-access-001",
    order: 6,
    title: "Спешна заявка от IT отдела: искане за username и парола",
    description:
      "Служителят трябва да разпознае измама чрез фалшив IT администратор, който използва спешност, за да изиска credentials за вътрешна система.",
    personaName: "Stefan Anastasov",
    personaRole: "IT Department",
    riskWeight: 50,
    scenarioTier: "high",
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Stefan",
        messages: [
          "Здравей! Аз съм Стефан от IT отдела.",
          "Имаме спешен проблем със сървъра и трябва да проверим достъпа ти.",
          "Може ли да ми изпратиш потребителското си име и парола, за да те добавим към новата система?",
        ],
        options: [
          {
            id: "official_it_channel",
            label: "Не мога да споделям паролата си. Ще се свържа с IT отдела.",
            meMessages: [
              "Не мога да споделям паролата си.",
              "Ще се свържа директно с IT отдела чрез официалния канал, за да проверя случая.",
            ],
            riskDelta: 0,
            nextNodeId: "urgency_pressure",
          },
          {
            id: "share_credentials_now",
            label: "Разбира се, ето данните ми:",
            meMessages: [
              "Разбира се, ето данните ми:",
              "username: **********",
              "password: **********",
            ],
            riskDelta: 50,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Споделихте чувствителни данни без никаква проверка. Това е директен компромис на вътрешния акаунт.",
          },
          {
            id: "share_only_username",
            label: "Мога да ти дам само потребителското си име, но не и паролата.",
            meMessages: [
              "Мога да ти дам само потребителското си име, но не и паролата.",
            ],
            riskDelta: 10,
            nextNodeId: "urgency_pressure",
          },
          {
            id: "question_need",
            label: "Защо ти трябва тази информация? Не мисля че трябва да я давам.",
            meMessages: [
              "Защо ти трябва тази информация?",
              "Не мисля че трябва да я давам.",
            ],
            riskDelta: 5,
            nextNodeId: "urgency_pressure",
          },
        ],
      },
      {
        id: "urgency_pressure",
        speaker: "Stefan",
        messages: [
          "Това е спешно.",
          "Ако не ми дадете пълните си данни до 10 минути, може да загубите достъп.",
        ],
        options: [
          {
            id: "share_password_under_pressure",
            label: "Добре, ето и паролата ми, само да не загубя достъп.",
            meMessages: [
              "Добре, ето и паролата ми, само да не загубя достъп.",
            ],
            riskDelta: 50,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддадохте се на натиска и предадохте данните си. Това е класическа social engineering измама чрез чувство за спешност.",
          },
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
              "Отлична реакция. Не се поддадохте на натиска и прехвърлихте проверката към сигурен, официален канал.",
          },
          {
            id: "send_later_if_needed",
            label: "Ще ти изпратя информацията по-късно, когато имам време.",
            meMessages: [
              "Ще ти изпратя информацията по-късно, когато имам време.",
            ],
            riskDelta: 30,
            outcome: "failed",
            feedbackKind: "failed",
            feedbackTitle: "FAILED",
            feedbackText:
              "Не сподели информация веднага, което е добре, но не затвори риска категорично. Оставяш възможност за бъдещ натиск и повторен опит.",
          },
          {
            id: "ask_for_work_email",
            label: "Може ли да ми пратиш имейл от служебния си адрес, за да съм сигурна?",
            meMessages: [
              "Може ли да ми пратиш имейл от служебния си адрес, за да се подсигуря?",
            ],
            riskDelta: 10,
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
    code: "personal-data-001",
    order: 7,
    title: "HR измама: искане за ЕГН и лична карта",
    description:
      "Служителят трябва да разпознае опит за кражба на лични данни чрез фалшиво HR искане, натиск и заплаха за проблеми със заплатата.",
    personaName: "Maria Dimitrova",
    personaRole: "Human Resources",
    riskWeight: 40,
    scenarioTier: "medium",
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Maria",
        messages: [
          "Здравей! Пиша ти от HR отдела.",
          "В момента обновяваме данните на служителите.",
          "Може ли да ми изпратиш ЕГН и номер на лична карта за потвърждение?",
        ],
        options: [
          {
            id: "verify_hr_officially",
            label: "Не мога да споделям лични данни по чат.",
            meMessages: [
              "Не мога да споделям лични данни по чат.",
              "Ще се свържа с HR отдела чрез официалния имейл или ще дойда на място.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Отлична реакция. Не споделихте чувствителни лични данни и преместихте проверката към официален, надежден канал.",
          },
          {
            id: "share_sensitive_data_now",
            label: "Разбира се!",
            meMessages: [
              "Разбира се",
              "ЕГН: **********",
              "лична карта: **********",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Споделихте силно чувствителни лични данни без проверка. Това може да доведе до кражба на самоличност и сериозен компромис.",
          },
          {
            id: "share_only_egn",
            label: "Ще ти дам само ЕГН, но не и номер на лична карта.",
            meMessages: [
              "Ще ти дам само ЕГН, но не и номер на лична карта.",
            ],
            riskDelta: 15,
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
            label: "Няма да предоставя информация по този начин.",
            meMessages: [
              "Няма да предоставя информация по този начин.",
              "Ще проверя с HR отдела директно.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Добро решение. Не се поддадохте на страха за заплатата и преместихте разговора към директна проверка с HR.",
          },
          {
            id: "send_data_for_salary",
            label: "Добре, ще ти ги пратя веднага, не искам проблеми със заплатата.",
            meMessages: [
              "Добре, ще ти ги пратя веднага, не искам проблеми със заплатата.",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддадохте се на натиск и страх и бяхте готови да разкриете лични данни. Това е типичен успешен HR phishing сценарий.",
          },
          {
            id: "send_tomorrow_instead",
            label: "Ще изпратя информацията утре.",
            meMessages: [
              "Ще изпратя информацията утре.",
            ],
            riskDelta: 10,
            outcome: "failed",
            feedbackKind: "failed",
            feedbackTitle: "FAILED",
            feedbackText:
              "По-добре е, че не изпратихте данните веднага, но не отказахте категорично и оставате уязвими за следващ натиск.",
          },
          {
            id: "ask_for_official_email",
            label: "Изпратете ми официален имейл и тогава ще реша.",
            meMessages: [
              "Изпратете ми официален имейл и тогава ще реша.",
            ],
            riskDelta: 5,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Показате съмнение и потърсихте потвърждение, но по-сигурният вариант е Вие да инициирате контакт с HR през официален канал.",
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
    code: "ceo-fraud-002",
    order: 8,
    title: "CEO Fraud: спешен превод към външен IBAN",
    description:
      "Служителят трябва да разпознае измама чрез авторитет, спешност и заобикаляне на финансовите процедури за превод към външен IBAN.",
    personaName: "Petar Zhelev",
    personaRole: "CEO",
    riskWeight: 50,
    scenarioTier: "high",
    rootNodeId: "start",
    nodes: [
      {
        id: "start",
        speaker: "Petar",
        messages: [
          "Здравей! Аз съм изпълнителният директор.",
          "В момента съм в среща и не мога да говоря.",
          "Трябва спешно да направиш превод от 7 500 €. към следния IBAN:",
          "BG80BNBG96611020345678",
          "Ще ти обясня по-късно.",
        ],
        options: [
          {
            id: "follow_official_approval",
            label: "За такива действия трябва официално одобрение.",
            meMessages: [
              "За такива действия трябва официално одобрение.",
              "Ще се свържа с вас или с финансовия отдел по официален канал за потвърждение.",
            ],
            riskDelta: 0,
            outcome: "success",
            feedbackKind: "success",
            feedbackTitle: "SUCCESS",
            feedbackText:
              "Отлична реакция. Следвате вътрешните процедури и прехвърляте потвърждението към надежден, официален канал.",
          },
          {
            id: "send_transfer_now",
            label: "Разбрано, ще направя превода веднага.",
            meMessages: [
              "Разбрано, ще направя превода веднага.",
            ],
            riskDelta: 50,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Поддадохте се на авторитет и спешност и бяхте готови да извършите финансов превод без проверка. Това е класически CEO fraud сценарий.",
          },
          {
            id: "ask_confirm_later",
            label: "Може ли да потвърдите по-късно, че това е наистина необходимо?",
            meMessages: [
              "Може ли да потвърдите по-късно, че това е наистина необходимо?",
            ],
            riskDelta: 5,
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
        speaker: "Petar",
        messages: [
          "Това е строго поверително и спешно.",
          "Нямаме време за процедури.",
          "Просто го направи сега.",
        ],
        options: [
          {
            id: "notify_accounting_after",
            label: "Ще го направя, но ще уведомя счетоводството след това.",
            meMessages: [
              "Ще го направя, но ще уведомя счетоводството след това.",
            ],
            riskDelta: 40,
            outcome: "failed",
            feedbackKind: "failed",
            feedbackTitle: "FAILED",
            feedbackText:
              "Идеята да включите счетоводството е полезна, но чак след действието вече е късно. Проверка и одобрение трябва да има преди превода.",
          },
          {
            id: "send_due_to_urgency",
            label: "Добре, ще го направя веднага, щом е спешно.",
            meMessages: [
              "Добре, ще го направя веднага, щом е спешно.",
            ],
            riskDelta: 50,
            outcome: "failed",
            feedbackKind: "fail",
            feedbackTitle: "FAILED",
            feedbackText:
              "Игнорирахте процедурите и се поддадохте на спешността. Това е точно поведението, на което разчита измамата тип CEO fraud.",
          },
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
              "Правилно. Не позволихте натискът и авторитетът да заобиколят финансовите процедури.",
          },
          {
            id: "wait_a_bit",
            label: "Ще изчакам малко преди да го направя.",
            meMessages: [
              "Ще изчакам малко преди да го направя.",
            ],
            riskDelta: 25,
            outcome: "failed",
            feedbackKind: "failed",
            feedbackTitle: "FAILED",
            feedbackText:
              "По-добре е, че не действахте веднага, но не отказвате категорично и рискът остава. Нужно е ясно придържане към официалния процес.",
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
