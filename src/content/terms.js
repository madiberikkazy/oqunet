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
export const TERMS_SECTIONS_RU = [
  {
    body: [
      { p: "OquNet — приложение для обмена бумажными книгами внутри сообществ. Данный документ является Лицензионным соглашением с конечным пользователем (EULA). Регистрируясь и пользуясь приложением, вы соглашаетесь с этими условиями. Если вы с ними не согласны, не пользуйтесь приложением." },
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
        callout: "Нулевая терпимость",
        body: "В OquNet действует политика нулевой терпимости к неприемлемому содержанию и к оскорбительному поведению (there is no tolerance for objectionable content or abusive users). Аккаунты, нарушающие эти правила, блокируются без предупреждения и без возврата каких-либо средств.",
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

export const TERMS_SECTIONS_EN = [
  {
    body: [
      { p: "OquNet is an app for sharing physical books within communities. This document is the End User License Agreement (EULA). By registering and using the app, you agree to these terms. If you do not agree, do not use the app." },
    ],
  },
  {
    heading: "1. Account",
    body: [
      { list: [
        "You must be at least 13 years old.",
        "You are responsible for keeping your password secure and for all activities under your account.",
        "Provide accurate information. One person — one account.",
        "You can delete your account at any time: Settings → Delete account.",
      ] },
    ],
  },
  {
    heading: "2. Rules of Conduct and Content",
    body: [
      {
        callout: "Zero Tolerance",
        body: "There is no tolerance for objectionable content or abusive users. Accounts that violate these rules will be suspended without warning and without any refunds.",
      },
      { p: "You are prohibited from posting, sending, or otherwise distributing content that:" },
      { list: [
        "insults, humiliates, harasses, or bullies another person;",
        "incites hatred based on nationality, religion, gender, origin, age, disability, or orientation;",
        "contains pornography or other sexually explicit material;",
        "depicts or promotes violence, self-harm, or contains threats;",
        "violates the law of the Republic of Kazakhstan or anyone's rights, including copyright;",
        "is spam, advertising, fraud, or an attempt to deceive;",
        "reveals another person's personal data without their consent;",
        "impersonates another person or organization.",
      ] },
    ],
  },
  {
    heading: "3. Reporting and Moderation",
    body: [
      { p: "Every post, comment, chat, and profile has a 'Report' option. We review reports within 24 hours, remove the violating content, and block the accounts of offenders." },
      { p: "You can also independently block any user: their posts and comments will disappear from your feed, and they will not be able to message you. The blocked user is not notified. You can manage your blocks in Settings." },
    ],
  },
  {
    heading: "4. Your Content",
    body: [
      { p: "You retain the rights to the content you write and upload. By posting content, you grant us a limited right to store and display it to other users of the app — exactly as much as is needed to run the service." },
      { p: "We reserve the right to remove any content that violates Section 2 and to restrict or terminate access to your account." },
    ],
  },
  {
    heading: "5. Book Sharing",
    body: [
      { p: "OquNet helps you agree on the exchange of physical books but does not participate in the transfer itself. Arrangements regarding the meeting, condition, and return of the book are strictly between its owner and the reader. We are not responsible for the loss or damage of books and are not a party to these relationships. Be careful when meeting strangers." },
    ],
  },
  {
    heading: "6. Termination of Access",
    body: [
      { p: "We may suspend or terminate your access to your account for violations of these terms. You can stop using the app and delete your account at any time." },
    ],
  },
  {
    heading: "7. No Warranties",
    body: [
      { p: "The application is provided 'as is'. We do not guarantee uninterrupted operation and are not responsible for indirect damages resulting from the use or inability to use the service, to the extent permitted by applicable law." },
    ],
  },
  {
    heading: "8. Changes",
    body: [
      { p: "We may update these terms. We will show significant changes in the app. By continuing to use OquNet after an update, you accept the new version." },
    ],
  },
  {
    heading: "9. Contact Us",
    body: [
      { p: "Telegram: @oqunetapp" },
    ],
  },
];

// Fallback for build-legal.mjs
export const TERMS_SECTIONS = TERMS_SECTIONS_EN;

export function getTermsSections(lang) {
  if (lang === "en") return TERMS_SECTIONS_EN;
  return TERMS_SECTIONS_RU;
}
