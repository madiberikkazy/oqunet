/**
 * Пайдалану шарттары — the terms, once, as data.
 *
 * ── Why this is not just an HTML page ───────────────────────────────────────
 *
 * The terms are needed in two places that cannot share a file:
 *
 *   in the app   a dialog with "agree" and "decline", shown during
 *                registration. It has to work offline, on the plane, before
 *                the account exists — so it cannot be a fetch — and it has to
 *                look like the rest of the app rather than a web page in a box.
 *   on the web   a URL, because App Store Connect and Google Play ask for one
 *                and reviewers open it.
 *
 * Two hand-written copies of a legal document is two documents, and the day
 * they disagree is the day somebody agreed to something we cannot show. So
 * this is the source, the app renders it directly, and scripts/build-legal.mjs
 * generates public/terms.html from it. Edit here; run `npm run legal`.
 *
 * ── The version, and why it is a date ───────────────────────────────────────
 *
 * What every account stores alongside the moment they agreed. A date is the
 * one version string nobody has to invent a convention for, it sorts, and it
 * is meaningful to a person reading a support ticket a year later. Change the
 * text below and change this — an account that agreed to the old wording is
 * then visibly an account that has not seen the new one.
 */

export const TERMS_VERSION = "2026-09-07";

/** Shown under the title, in both renderings. */
export const TERMS_UPDATED = "7 сентября 2026";

/**
 * Blocks, in order. Three kinds:
 *   { p }              a paragraph
 *   { list: [...] }    a bulleted list
 *   { callout, body }  the boxed clause — used once, for zero tolerance
 */
export const TERMS_SECTIONS = [
  {
    body: [
      { p: "OquNet — приложение для обмена бумажными книгами внутри сообществ. Регистрируясь и пользуясь приложением, вы соглашаетесь с этими условиями. Если вы с ними не согласны, не пользуйтесь приложением." },
    ],
  },
  {
    heading: "1. Аккаунт",
    body: [
      { list: [
        "Вам должно быть не менее 13 лет.",
        "Вы отвечаете за сохранность пароля и за всё, что происходит под вашим аккаунтом.",
        "Указывайте достоверные данные. Один человек — один аккаунт.",
        "Аккаунт можно удалить в любой момент: Настройки → Удалить аккаунт.",
      ] },
    ],
  },
  {
    heading: "2. Правила поведения и содержания",
    body: [
      {
        // The clause App Store guideline 1.2 requires of an app carrying user
        // content. Boxed in both renderings because a reviewer looks for it
        // and a reader should not be able to scroll past it.
        callout: "Нулевая терпимость",
        body: "В OquNet действует политика нулевой терпимости к неприемлемому содержанию и к оскорбительному поведению. Аккаунты, нарушающие эти правила, блокируются без предупреждения и без возврата каких-либо средств.",
      },
      { p: "Запрещено размещать, пересылать или иным образом распространять содержание, которое:" },
      { list: [
        "оскорбляет, унижает, преследует или запугивает другого человека;",
        "разжигает вражду по признаку национальности, религии, пола, происхождения, возраста, инвалидности или ориентации;",
        "содержит порнографию или иные материалы сексуального характера;",
        "изображает или пропагандирует насилие, самоповреждение либо содержит угрозы;",
        "нарушает закон Республики Казахстан или чьи-либо права, включая авторские;",
        "является спамом, рекламой, мошенничеством или попыткой обмана;",
        "раскрывает персональные данные другого человека без его согласия;",
        "выдаёт вас за другого человека или организацию.",
      ] },
    ],
  },
  {
    heading: "3. Жалобы и модерация",
    body: [
      { p: "В каждом посте, комментарии, чате и профиле есть пункт «Пожаловаться». Мы рассматриваем жалобы в течение 24 часов и удаляем нарушающее содержание, а также блокируем аккаунты нарушителей." },
      { p: "Вы также можете самостоятельно заблокировать любого пользователя: его записи и комментарии исчезнут из вашей ленты, и он не сможет вам писать. Заблокированный об этом не уведомляется. Список блокировок — в Настройках." },
    ],
  },
  {
    heading: "4. Ваше содержание",
    body: [
      { p: "Права на написанное и загруженное вами остаются вашими. Размещая содержание, вы даёте нам ограниченное право хранить и показывать его другим пользователям приложения — ровно настолько, насколько это нужно для работы сервиса." },
      { p: "Мы вправе удалить любое содержание, нарушающее раздел 2, и ограничить или прекратить доступ к аккаунту." },
    ],
  },
  {
    heading: "5. Обмен книгами",
    body: [
      { p: "OquNet помогает договориться об обмене физическими книгами, но не участвует в самой передаче. Договорённости о встрече, состоянии и возврате книги — между её владельцем и читателем. Мы не отвечаем за утрату или порчу книг и не являемся стороной этих отношений. Будьте осторожны при встречах с незнакомыми людьми." },
    ],
  },
  {
    heading: "6. Прекращение доступа",
    body: [
      { p: "Мы можем приостановить или прекратить доступ к аккаунту при нарушении этих условий. Вы можете прекратить пользоваться приложением и удалить аккаунт в любой момент." },
    ],
  },
  {
    heading: "7. Отсутствие гарантий",
    body: [
      { p: "Приложение предоставляется «как есть». Мы не гарантируем бесперебойной работы и не отвечаем за косвенные убытки, возникшие из-за использования или невозможности использования сервиса, в пределах, допустимых применимым правом." },
    ],
  },
  {
    heading: "8. Изменения",
    body: [
      { p: "Мы можем обновлять эти условия. Существенные изменения мы покажем в приложении. Продолжая пользоваться OquNet после обновления, вы принимаете новую редакцию." },
    ],
  },
  {
    heading: "9. Связь с нами",
    body: [
      { p: "Telegram: @oqunetapp" },
    ],
  },
];
