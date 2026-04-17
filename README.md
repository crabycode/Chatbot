# cybreach

Node.js + Express + MongoDB prototype за обучение на служители по киберсигурност чрез чат сценарии тип social engineering / CEO fraud.

## Какво вече има

- login с потребители от MongoDB;
- тестов flow с branching отговори;
- междинен `SUCCESS / FAILED` екран след всеки сценарий;
- финален report с брой верни решения и `risk score`;
- seed данни с 1 потребител и 1 примерен сценарий;
- UI, който се отваря на `http://localhost:3000`.

## Технологии

- Node.js
- Express
- EJS templates
- MongoDB
- express-session

## Стартиране

1. Увери се, че имаш Node.js 20+.
2. Стартирай MongoDB локално.

Ако искаш с Docker:

```powershell
docker compose up -d
```

3. Подготви `.env`:

```powershell
Copy-Item .env.example .env
```

4. Инсталирай зависимостите:

```powershell
npm.cmd install
```

5. Seed-вай примерните данни:

```powershell
npm.cmd run seed
```

6. Стартирай приложението:

```powershell
npm.cmd run dev
```

7. Отвори:

```text
http://localhost:3000
```

## Demo credentials

- Username: `worker1`
- Password: `TrainMe123!`

## Windows бележка

Ако PowerShell ти върне грешка за `npm.ps1` / execution policy, използвай `npm.cmd` вместо `npm`.
Можеш и директно да пуснеш:

```powershell
start-local.cmd
```

## Env променливи

```env
APP_NAME=cybreach
PORT=3000
SESSION_SECRET=change-me-before-production
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=cyber_training_bot
PASS_THRESHOLD=0.7
```

## Risk score

Всеки сценарий има `riskWeight`.

- всяка грешна или рискова стъпка добавя `riskDelta`;
- финалният score е:

```text
totalRiskIncurred / totalMaxRisk * 100
```

По-нисък процент е по-добър.

## Структура

```text
src/
  server.js
  config.js
  db.js
  services/
scripts/
views/
public/
```

## Следващи логични подобрения

- admin UI за добавяне на сценарии;
- 10 готови seed сценария вместо 1;
- leaderboard / history по служители;
- export на отчети;
- time-based scoring;
- dashboard за security/HR екип.
