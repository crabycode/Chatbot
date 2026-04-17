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
