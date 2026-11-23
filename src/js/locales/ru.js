// Russian texts for src/js/i18n.js. Each key is the English text of an element
// (or an attribute) exactly as it reads on the page, with spaces collapsed;
// the value is what replaces it. Values may contain the same markup as the
// English element. If you change an English text in index.html, change its key
// here too, otherwise that piece simply stays in English.
(function () {
  'use strict';

  const P = window.Portfolio;
  if (!P) return;
  P.locales = P.locales || {};

  P.locales.ru = {
    // ---------- Page and editor chrome ----------
    'Nazima Jumaniyazova | Frontend Software Engineer':
      'Nazima Jumaniyazova | Frontend-разработчик',
    'Skip to content': 'Перейти к содержимому',
    'Toggle explorer': 'Показать или скрыть проводник',
    'Simple view': 'Простой вид',
    'Simple view: my resume as a regular page': 'Простой вид: резюме обычной страницей',
    Tools: 'Инструменты',
    'Explorer (Ctrl B)': 'Проводник (Ctrl B)',
    'Search in files (Ctrl Shift F)': 'Поиск по файлам (Ctrl Shift F)',
    'Source control (Ctrl Shift G)': 'Контроль версий (Ctrl Shift G)',
    'Run and debug (F5)': 'Запуск и отладка (F5)',
    Run: 'Запуск',
    'Toggle terminal (Ctrl J)': 'Показать или скрыть терминал (Ctrl J)',
    'Terminal (Ctrl J)': 'Терминал (Ctrl J)',
    'Settings (Ctrl ,)': 'Настройки (Ctrl ,)',
    'Change color theme': 'Сменить цветовую тему',
    'Side bar': 'Боковая панель',
    Explorer: 'Проводник',
    Search: 'Поиск',
    Files: 'Файлы',
    'My path as a commit graph. Click a commit to see what it added.':
      'Мой путь в виде графа коммитов. Нажмите на коммит, чтобы увидеть, что он добавил.',
    'Search in all files': 'Поиск по всем файлам',
    'Search in files': 'Поиск в файлах',
    'Tip: press Ctrl K to jump to any file, Ctrl Shift F to search inside them, or type help in the terminal.':
      'Совет: <kbd>Ctrl K</kbd> открывает любой файл, <kbd>Ctrl Shift F</kbd> ищет внутри файлов, а в терминале можно набрать <kbd>help</kbd>.',
    'Resize the side bar': 'Изменить ширину боковой панели',
    'Drag to resize, double-click to reset':
      'Перетащите, чтобы изменить размер. Двойной щелчок сбрасывает его',
    'Open files': 'Открытые файлы',
    'Split editor right': 'Разделить редактор вправо',
    'Split editor right (or drag a tab to the right)':
      'Разделить редактор вправо (или перетащите вкладку вправо)',
    Preview: 'Превью',
    'No file is open.': 'Нет открытых файлов.',
    'Open README.md': 'Открыть README.md',
    'Ctrl K search files and commands': '<kbd>Ctrl K</kbd> поиск файлов и команд',
    'Ctrl J toggle the terminal': '<kbd>Ctrl J</kbd> показать или скрыть терминал',
    'Second editor': 'Второй редактор',
    'Close the second editor': 'Закрыть второй редактор',
    'Open to the side': 'Открыть сбоку',
    Terminal: 'Терминал',
    'Resize the terminal': 'Изменить высоту терминала',
    'try: help, run, npm test, snake': 'попробуйте: help, run, npm test, snake',
    'Clear terminal': 'Очистить терминал',
    'Toggle terminal': 'Показать или скрыть терминал',
    'Terminal command': 'Команда терминала',
    'Source control': 'Контроль версий',
    'Local time in Tashkent': 'Местное время в Ташкенте',
    Tashkent: 'Ташкент',
    'Search files and commands': 'Поиск файлов и команд',
    Results: 'Результаты',
    'no public link': 'нет публичной ссылки',
    'Nazima Jumaniyazova, frontend software engineer from Tashkent.':
      'Nazima Jumaniyazova, frontend-разработчик из Ташкента.',
    '5 years with React and TypeScript, 2 of them in banking.':
      '5 лет с React и TypeScript, из них 2 года в банковской сфере.',
    'Open to relocation and business trips.': 'Готова к переезду и командировкам.',
    'Type {help} to see what this terminal can do.':
      'Наберите {help}, чтобы узнать, что умеет этот терминал.',

    // ---------- .vscode/settings.json ----------
    'Editor settings': 'Настройки редактора',
    '↺ Reset to defaults': '↺ Сбросить настройки',
    '// Click a value to change it. The editor reacts right away':
      '// Нажмите на значение, чтобы изменить его. Редактор сразу',
    '// and remembers your choice in this browser.':
      '// применит его и запомнит выбор в этом браузере.',
    'editor.fontSize in pixels': 'editor.fontSize в пикселях',
    'Smaller font': 'Шрифт меньше',
    'Bigger font': 'Шрифт больше',
    '// wide screens': '// на широких экранах',
    '// "en" or "ru"': '// "en" или "ru"',

    // ---------- README.md ----------
    '> Frontend Software Engineer, Tashkent':
      '<span class="m">&gt;</span> Frontend-разработчик, Ташкент',
    'Frontend Engineer with 5 years of experience building and maintaining scalable web applications using React and TypeScript, including 2 years developing banking and fintech products.':
      'Frontend-разработчик с 5-летним опытом создания и поддержки масштабируемых веб-приложений на <code class="s">React</code> и <code class="s">TypeScript</code>, из них 2 года в разработке банковских и финтех-продуктов.',
    'I specialize in building complex, data-intensive interfaces, translating UI/UX designs into responsive applications, and optimizing frontend performance.':
      'Специализируюсь на сложных интерфейсах с большим объёмом данных: превращаю UI/UX-макеты в адаптивные приложения и оптимизирую производительность фронтенда.',
    'I take ownership of features end to end — from technical implementation and architecture decisions to testing and production delivery.':
      'Веду фичи от начала до конца — от технической реализации и архитектурных решений до тестирования и выкладки в продакшен.',
    'Beyond development, I actively participate in code reviews, maintain technical documentation, and mentor fellow frontend engineers. Experienced in collaborating with cross-functional, distributed, and remote-first teams.':
      'Помимо разработки, активно участвую в код-ревью, веду техническую документацию и менторю других фронтенд-разработчиков. Есть опыт работы в кросс-функциональных, распределённых и удалённых командах.',
    '## Start here': '## С чего начать',
    'what I have built': 'что я сделала',
    'where I have worked': 'где я работала',
    'what I work with': 'с чем я работаю',
    'teaching at The Rolling Scopes School': 'преподаю в The Rolling Scopes School',
    'how to reach me': 'как со мной связаться',
    'my public repositories, live from GitHub': 'мои публичные репозитории прямо с GitHub',
    '## Shortcuts': '## Горячие клавиши',
    '- Simple view in the title bar shows all of this as a regular resume':
      '<span class="m">-</span> <kbd>Простой вид</kbd> в верхней панели показывает всё это обычным резюме',
    '- Ctrl K search files and commands':
      '<span class="m">-</span> <kbd>Ctrl K</kbd> поиск файлов и команд',
    '- Ctrl Shift F search inside all files':
      '<span class="m">-</span> <kbd>Ctrl Shift F</kbd> поиск по содержимому всех файлов',
    '- Ctrl J toggle the terminal':
      '<span class="m">-</span> <kbd>Ctrl J</kbd> показать или скрыть терминал',
    '- Ctrl B toggle the explorer':
      '<span class="m">-</span> <kbd>Ctrl B</kbd> показать или скрыть проводник',
    '- press ▶ Run in any project file to start it':
      '<span class="m">-</span> нажмите <kbd>▶ Run</kbd> в файле любого проекта, чтобы запустить его',
    '- hover a skill to see where I used it':
      '<span class="m">-</span> наведите на навык, чтобы увидеть, где я его применяла',
    '- Ctrl Shift G my path as a commit graph':
      '<span class="m">-</span> <kbd>Ctrl Shift G</kbd> мой путь в виде графа коммитов',
    '- F5 step through my career in the debugger':
      '<span class="m">-</span> <kbd>F5</kbd> пройти по моей карьере в отладчике',
    '- drag a tab to the right to open two files side by side':
      '<span class="m">-</span> перетащите вкладку вправо, чтобы открыть два файла рядом',
    '- drag the edge of the side bar or the terminal to resize them':
      '<span class="m">-</span> потяните за край боковой панели или терминала, чтобы изменить их размер',
    '- settings.json font size, word wrap and more':
      '<span class="m">-</span> <a href="#settings">settings.json</a> язык, размер шрифта, перенос строк и не только',
    '- type help in the terminal to see what it can do':
      '<span class="m">-</span> наберите <kbd>help</kbd> в терминале, чтобы узнать, что он умеет',
    'Portrait of Nazima Jumaniyazova': 'Портрет: Nazima Jumaniyazova',
    'View my work': 'Мои проекты',
    'Download CV': 'Скачать CV',

    // ---------- about.md ----------
    '# About me': '# Обо мне',
    'Frontend engineer with 5 years of experience building and maintaining large-scale single-page applications in React and TypeScript, including 2 years on banking and financial products.':
      'Frontend-разработчик с 5 годами опыта создания и поддержки крупных одностраничных приложений на React и TypeScript, из них 2 года в банковских и финансовых продуктах.',
    'I own features end to end, from design hand-off to production, with a focus on performance optimization, clean architecture and test coverage.':
      'Веду задачи от начала до конца, от передачи дизайна до продакшена, с упором на производительность, чистую архитектуру и покрытие тестами.',
    'I review code daily, maintain technical documentation, and mentor other frontend developers. Experienced in distributed, remote-first teams.':
      'Каждый день провожу код-ревью, веду техническую документацию и менторю других frontend-разработчиков. Есть опыт работы в распределённых удалённых командах.',
    '## Right now': '## Сейчас',
    '- Building product interfaces at PLATMA, remotely':
      '<span class="m">-</span> Разрабатываю интерфейсы продукта в <a href="#experience">PLATMA</a>, удалённо',
    '- Mentoring at The Rolling Scopes School':
      '<span class="m">-</span> Менторю в <a href="#mentoring">The Rolling Scopes School</a>',
    '- Based in Tashkent, open to relocation and business trips':
      '<span class="m">-</span> Живу в Ташкенте, готова к переезду и командировкам',
    '<!-- next:': '&lt;!-- дальше:',
    '// next:': '// дальше:',
    '// see also:': '// см. также:',
    '<!-- see also:': '&lt;!-- см. также:',
    '// more on': '// больше на',

    // ---------- skills.json, experience.ts ----------
    Skills: 'Навыки',
    Experience: 'Опыт работы',
    "'Sep 2025 – present'": "'сен 2025 – сейчас'",
    "'Sep 2023 – Aug 2025'": "'сен 2023 – авг 2025'",
    "'Sep 2021 – Sep 2023'": "'сен 2021 – сен 2023'",
    "'Frontend Software Engineer'": "'Frontend-разработчик'",
    "'Remote, full-time'": "'Удалённо, полная занятость'",
    "'Tashkent, Uzbekistan'": "'Ташкент, Узбекистан'",
    "'Deliver core product features in React end to end, from planning and estimation through to production release.'":
      "'Разрабатываю ключевые функции продукта на React от начала до конца: от планирования и оценки до релиза.'",
    "'Build responsive, cross-browser layouts with HTML/CSS, Sass/LESS and UI libraries (MUI, Bootstrap).'":
      "'Верстаю адаптивные кроссбраузерные интерфейсы на HTML/CSS, Sass/LESS и UI-библиотеках (MUI, Bootstrap).'",
    "'Manage application state with Redux and integrate with backend services over REST API.'":
      "'Управляю состоянием приложения через Redux и связываю его с бэкендом по REST API.'",
    "'Write and maintain automated component tests with Jest and React Testing Library.'":
      "'Пишу и поддерживаю автотесты компонентов на Jest и React Testing Library.'",
    "'Optimize frontend performance through code splitting, lazy loading, memoization and caching.'":
      "'Ускоряю фронтенд: code splitting, lazy loading, мемоизация и кеширование.'",
    "'Take part in code reviews and keep technical documentation for components and modules up to date.'":
      "'Участвую в код-ревью и поддерживаю техническую документацию по компонентам и модулям в актуальном состоянии.'",
    "'Improved UX and runtime performance of the internal analytics system by 40%.'":
      "'Улучшила UX и производительность внутренней аналитической системы на 40%.'",
    "'Reduced dashboard load time by 30% by introducing WebSocket streaming and lazy-loading with code splitting.'":
      "'Сократила время загрузки дашбордов на 30% за счёт потоковых данных через WebSocket и lazy loading с code splitting.'",
    "'Built and documented a shared component library that cut delivery time for new interfaces by 25% and unified the UI across product teams.'":
      "'Создала и задокументировала общую библиотеку компонентов: новые интерфейсы стали выходить на 25% быстрее, а UI стал единым для всех продуктовых команд.'",
    "'Implemented dynamic, schema-driven application forms with complex multi-step validation, and real-time financial dashboards with ApexCharts.'":
      "'Сделала динамические формы заявок на основе схем со сложной многошаговой валидацией и финансовые дашборды в реальном времени на ApexCharts.'",
    "'Worked in a regulated financial environment with strict requirements for data accuracy, security and accessibility.'":
      "'Работала в регулируемой финансовой среде со строгими требованиями к точности данных, безопасности и доступности.'",
    "'VideoHub.uz: LMS with progress tracking, role-based access and in-app messaging.'":
      "'VideoHub.uz: LMS с отслеживанием прогресса, ролевым доступом и встроенными сообщениями.'",
    "'DachaTop.uz: real-estate portal with authentication, analytics and listing management.'":
      "'DachaTop.uz: портал недвижимости с авторизацией, аналитикой и управлением объявлениями.'",
    "'Scolaro.uz: university admissions platform with advanced filtering and reviews.'":
      "'Scolaro.uz: платформа для поступления в вузы с расширенными фильтрами и отзывами.'",
    "'Built responsive React interfaces, integrated REST APIs, and implemented business logic and user scenarios, working directly with designers and clients to translate Figma designs into production.'":
      "'Разрабатывала адаптивные интерфейсы на React, подключала REST API, реализовывала бизнес-логику и пользовательские сценарии. Работала напрямую с дизайнерами и заказчиками, превращая макеты Figma в готовый продукт.'",

    // ---------- Projects ----------
    '"Frontend, at Brain Development"': '"Frontend, в Brain Development"',
    '"A real-estate portal for renting dachas, with authentication, analytics and listing management."':
      '"Портал аренды дач с авторизацией, аналитикой и управлением объявлениями."',
    '"A learning management system (LMS) with progress tracking, role-based access and in-app messaging."':
      '"Система управления обучением (LMS) с отслеживанием прогресса, ролевым доступом и встроенными сообщениями."',
    '"A university admissions platform with advanced filtering and reviews."':
      '"Платформа для поступления в вузы с расширенными фильтрами и отзывами."',
    '"A transport rental platform offering minivans and minibuses for city transfers, tours, business trips, and events with or without a driver."':
      '"Платформа аренды транспорта: минивэны и микроавтобусы для трансферов по городу, туров, деловых поездок и мероприятий, с водителем или без."',
    '"MyMehmon.uz partner panel"': '"Панель партнёра MyMehmon.uz"',
    '"An admin panel for a hospitality booking platform that allows hotel owners to manage listings, rooms, bookings, and services."':
      '"Админ-панель платформы бронирования жилья, где владельцы отелей управляют объектами, номерами, бронированиями и услугами."',
    '"Advanced Todo app"': '"Todo-приложение"',
    '"Todo application with a simple list and an async list. A small study project."':
      '"Todo-приложение с обычным и асинхронным списком. Небольшой учебный проект."',
    'Open live site': 'Открыть сайт',
    'Next project': 'Следующий проект',
    'View code': 'Смотреть код',
    'Open DachaTop.uz': 'Открыть DachaTop.uz',
    'Open Videohub.uz': 'Открыть Videohub.uz',
    'Open Advanced Todo app': 'Открыть Todo-приложение',
    'DachaTop.uz listing page with filters, calendar and dacha cards':
      'Страница объявлений DachaTop.uz с фильтрами, календарём и карточками дач',
    'Videohub.uz home page with a list of programming courses':
      'Главная страница Videohub.uz со списком курсов по программированию',
    'Advanced Todo app with simple and async lists':
      'Todo-приложение с обычным и асинхронным списками',

    // ---------- github/repos.json (src/js/github.js) ----------
    'GitHub repositories': 'Репозитории на GitHub',
    '↻ Refresh': '↻ Обновить',
    'Open on GitHub': 'Открыть на GitHub',
    '// My public repositories, live from the GitHub API.':
      '// Мои публичные репозитории, напрямую из GitHub API.',
    '// Opening the file loads them.': '// Они загружаются при открытии файла.',
    '// Loading…': '// Загрузка…',
    '// GitHub is not answering right now (offline or rate limit).':
      '// GitHub сейчас не отвечает (нет сети или исчерпан лимит запросов).',
    'Try again': 'Повторить',
    '// {count} repositories, forks left out. Fetched at {time}.':
      '// Репозиториев: {count}, без форков. Загружено в {time}.',
    '// {count} more.': '// Ещё {count}.',
    'Show all': 'Показать все',
    'Could not load the repositories.': 'Не удалось загрузить репозитории.',
    'Loading…': 'Загрузка…',
    Live: 'Сайт',

    // ---------- Run and Debug (src/js/debug.js) ----------
    '▶ Debug my career': '▶ Отладить мою карьеру',
    'Run and Debug': 'Запуск и отладка',
    'Start debugging': 'Начать отладку',
    Stop: 'Остановить',
    'Steps through my career like a program. Every stage is a breakpoint, the variables come from the files.':
      'Проходит по моей карьере, как по программе. Каждый этап это точка останова, а переменные берутся из файлов.',
    Variables: 'Переменные',
    'Call stack': 'Стек вызовов',
    Breakpoints: 'Точки останова',
    'Not running.': 'Отладка не запущена.',
    Debug: 'Отладка',
    'Continue (F5)': 'Продолжить (F5)',
    'Step over (F10)': 'Шаг с обходом (F10)',
    'Restart (Ctrl Shift F5)': 'Перезапустить (Ctrl Shift F5)',
    'Stop (Shift F5)': 'Остановить (Shift F5)',
    'Paused on': 'Пауза:',
    'Debugging finished': 'Отладка завершена',

    // ---------- mentoring.md, education.md, certificates.json, languages.yml ----------
    '# Mentoring': '# Менторство',
    '**Frontend Mentor, The Rolling Scopes School**':
      '**Frontend-ментор, The Rolling Scopes School**',
    'Dec 2025 – present': 'дек 2025 – сейчас',
    'I mentor groups of 2–6 aspiring frontend developers through an intensive 11–13 week program at RS School, a free community-driven coding school with 1,500+ graduates worldwide.':
      'Веду группы из 2–6 начинающих frontend-разработчиков по интенсивной программе на 11–13 недель в RS School. Это бесплатная школа программирования, которую развивает сообщество, у неё более 1 500 выпускников по всему миру.',
    '- Conduct technical screening interviews on HTML, CSS and JavaScript fundamentals':
      '<span class="m">-</span> Провожу технические собеседования по основам HTML, CSS и JavaScript',
    '- Review student pull requests weekly: code quality, architecture, DRY/KISS, semantic HTML, CSS structure and JS patterns':
      '<span class="m">-</span> Каждую неделю проверяю пул-реквесты студентов: качество кода, архитектуру, DRY/KISS, семантичный HTML, структуру CSS и паттерны JS',
    '- Run weekly 60–90 minute sessions on curriculum topics':
      '<span class="m">-</span> Провожу еженедельные занятия по 60–90 минут по темам программы',
    '- Grade assignments against defined criteria and guide students from beginners to job-ready junior developers':
      '<span class="m">-</span> Оцениваю задания по чётким критериям и веду студентов от первых шагов до уровня junior-разработчика, готового к работе',
    '> Teaching others is one of the most powerful ways to grow as a developer yourself.':
      '<span class="m">&gt;</span> Учить других — один из лучших способов вырасти как разработчик самому.',
    '# Education': '# Образование',
    '**Lomonosov Moscow State University (MSU)**': '**МГУ имени М. В. Ломоносова**',
    "Bachelor's degree, Applied Mathematics and Computer Science":
      'Бакалавриат, прикладная математика и информатика',
    'graduated in 2017': 'выпуск 2017 года',
    Certificates: 'Сертификаты',
    '"May 2026"': '"май 2026"',
    '"Mar 2026"': '"мар 2026"',
    '"Jun 2025"': '"июн 2025"',
    '"May 2025"': '"май 2025"',
    '"Nov 2023"': '"ноя 2023"',
    Russian: 'Русский',
    Uzbek: 'Узбекский',
    English: 'Английский',
    Native: 'родной',
    'B2, Upper Intermediate': 'B2, выше среднего',

    // ---------- contact.ts ----------
    "// Let's get in touch.": '// Давайте свяжемся.',
    '▶ Write an email': '▶ Написать письмо',
    'Copy email': 'Скопировать email',
    '// Or write me right here and push it to my inbox:':
      '// Или напишите прямо здесь и отправьте мне через push:',
    'Your message': 'Ваше сообщение',
    'Hi Nazima! I would like to talk about…': 'Здравствуйте, Назима! Хочу обсудить…',

    // ---------- Simple view (src/js/plain.js) ----------
    Sections: 'Разделы',
    About: 'Обо мне',
    Projects: 'Проекты',
    Mentoring: 'Менторство',
    Education: 'Образование',
    Languages: 'Языки',
    Contact: 'Контакты',
    'Right now': 'Сейчас',
    'Source code': 'Исходный код',
    verify: 'проверить',
    Location: 'Город',
    'Write me an email': 'Написать мне письмо',
    'Editor view': 'Вид редактора',
    'This is the simple view of a portfolio built like a code editor.':
      'Это простой вид портфолио, сделанного в виде редактора кода.',
    'Open the editor view': 'Открыть вид редактора',
    'Not a developer? The same resume is also a regular page.':
      'Не разработчик? Это же резюме есть в виде обычной страницы.',
    'Open simple view': 'Открыть простой вид',
    Close: 'Закрыть',
    'Programming languages': 'Языки программирования',
    Frameworks: 'Фреймворки',
    'UI libraries': 'UI-библиотеки',
    Styling: 'Стили',
    Forms: 'Формы',
    Testing: 'Тестирование',
    Performance: 'Производительность',
    'Data and APIs': 'Данные и API',
    Tooling: 'Инструменты',
    Practices: 'Практики',
  };
})();
