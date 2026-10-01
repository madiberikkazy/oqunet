import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config.js";
import { useLang } from "../contexts/LanguageContext.jsx";
import "./Landing.css";

const PHOTO = {
  friends: "/images/readers-together.jpg",
  library: "/images/library-shelves.jpg",
  reader: "/images/reader-with-book.jpg",
};

const CONTENT = {
  en: {
    nav: ["How it works", "Why OquNet", "Community", "FAQ"], login: "Log in", join: "Join OquNet", menu: "Menu", skip: "Skip to content",
    eyebrow: "A reading community, made local", hero: "Pass the book.\nKeep the story moving.",
    intro: "OquNet is the friendly place to lend books, find your next read, and meet people who still get excited about a great chapter.",
    primary: "Explore the community", secondary: "See how it works", proof: "Built around real books and real readers", readers: "readers already here", note: "For readers in Kazakhstan · Free to join",
    ribbon: "Your next favourite book might be five minutes away.", storyTag: "Less shelf dust, more stories", story: "Books are better when they travel.", storyText: "A book you loved should not have to stop at your shelf. OquNet makes lending feel simple, personal, and safe — so every good story can find another reader.",
    stats: ["books shared", "readers connecting", "minutes spent reading"], featureTag: "One little app. A whole reading life.", featuresTitle: "Everything you need to read together.",
    features: [["⌕", "Find nearby books", "Browse shelves shared by readers in your community, not an endless anonymous catalogue."], ["♡", "Lend with confidence", "See where a book is and keep every handover clear and easy."], ["☻", "Make reading social", "Swap thoughts, join a reading room, or arrange an offline meetup." ]],
    howTag: "How OquNet works", how: "A book’s next chapter starts with you.", howText: "No subscriptions. No complicated rules. Just a calmer way to share the books you already love.", steps: [["Create your shelf", "Add the books you are happy to share."], ["Meet your next read", "Discover a title and send a borrow request."], ["Read, return, repeat", "Keep the conversation going — then pass a favourite on."]],
    communityTag: "For curious people", community: "Your reading people are out there.", communityText: "From a quiet solo reader to the person who underlines every page — OquNet brings together people who want books to be lived with, not just owned.", communityCta: "Start your shelf", quote: "“The book came back with a new note inside. That is the kind of magic I hoped for.”", quoteBy: "— A reader from Astana",
    faqTag: "Good questions", faq: "A few things you may be wondering.", faqs: [["Is OquNet free?", "Yes. Creating an account, adding books, and connecting with the community is free."], ["Can I choose who borrows my books?", "Always. You decide which books to list and approve each borrow request yourself."], ["Do I need a large book collection?", "Not at all. One book you loved is enough to start a wonderful shelf."], ["Where is OquNet available?", "OquNet is built for readers in Kazakhstan, with communities growing city by city."]],
    final: "A better reading life starts with one shared book.", finalText: "Set up your shelf in a few minutes and meet the readers around you.", footer: "Made for readers, by readers.", sticker: "Read|together", faqText: "OquNet is designed to make sharing feel natural from the first hello to the next handover.", previewTag: "A peek inside OquNet", previewTitle: "A whole reading community, right in your pocket.", previewText: "Find a book for tonight, save the ones you love, and see what your neighbours are reading.", previewPoints: ["Browse books shared nearby", "Save your next read for later", "Keep your reading life together"]
  },
  kz: {
    nav: ["Қалай жұмыс істейді", "Неге OquNet", "Қауымдастық", "Сұрақтар"], login: "Кіру", join: "OquNet-ке қосылу", menu: "Мәзір", skip: "Мазмұнға өту", eyebrow: "Оқырмандарға арналған жергілікті қауымдастық", hero: "Кітапты бөліс.\nОқиғаны жалғастыр.", intro: "OquNet — кітап беру, келесі оқуыңызды табу және жақсы тарауға әлі де қуанатын адамдармен танысуға арналған жылы орта.", primary: "Қауымдастықты көру", secondary: "Қалай жұмыс істейді", proof: "Шынайы кітаптар мен оқырмандар үшін", readers: "оқырман осында", note: "Қазақстан оқырмандарына · Қосылу тегін", ribbon: "Келесі сүйікті кітабыңыз бес минут жерде болуы мүмкін.", storyTag: "Сөредегі шаң аз, оқиға көп", story: "Кітаптар саяхаттағанда жақсырақ.", storyText: "Сіз сүйген кітап сөреде тоқтап қалмауы керек. OquNet кітап беруді қарапайым, жеке және сенімді етеді — жақсы оқиға келесі оқырманын тапсын.", stats: ["кітап бөлісілді", "оқырман байланыста", "минут оқылды"], featureTag: "Бір шағын қосымша. Толық оқу өмірі.", featuresTitle: "Бірге оқу үшін керектінің бәрі.", features: [["⌕", "Жақын кітаптарды табыңыз", "Қауымдастығыңыздағы оқырман сөрелерін шолыңыз."], ["♡", "Сеніммен беріңіз", "Кітаптың қайда екенін біліп, әр беруді түсінікті ұстаңыз."], ["☻", "Оқуды әлеуметтік етіңіз", "Ой бөлісіңіз, оқу бөлмесіне кіріңіз не офлайн кездесіңіз."]], howTag: "OquNet қалай жұмыс істейді", how: "Кітаптың келесі тарауы сізден басталады.", howText: "Жазылым да, күрделі ереже де жоқ. Тек өзіңіз жақсы көретін кітаптарды бөлісудің жайлы жолы.", steps: [["Сөреңізді жасаңыз", "Бөлісуге дайын кітаптарды қосыңыз."], ["Келесі оқуыңызды табыңыз", "Кітапты тауып, сұрау жіберіңіз."], ["Оқыңыз, қайтарыңыз, қайталаңыз", "Әңгімені жалғастырыңыз — сүйіктіні ары қарай беріңіз."]], communityTag: "Ізденімпаз жандарға", community: "Сіздің оқырман ортаңыз осында.", communityText: "Тыныш оқырманнан бастап әр бетті белгілейтін жанға дейін — OquNet кітаптар тек иеленілмей, бірге өмір сүруі керек дейтін адамдарды біріктіреді.", communityCta: "Сөреңізді бастаңыз", quote: "“Кітап ішіне жаңа жазба қалдырып қайтты. Мен күткен сиқыр осы еді.”", quoteBy: "— Астана оқырманы", faqTag: "Жақсы сұрақтар", faq: "Сізді қызықтыруы мүмкін жайттар.", faqs: [["OquNet тегін бе?", "Иә. Аккаунт ашу, кітап қосу және қауымдастыққа қосылу тегін."], ["Кітабымды кім алатынын таңдай аламын ба?", "Әрине. Қай кітапты шығаратыныңызды және әр сұрауды өзіңіз бекітесіз."], ["Үлкен кітапханам болуы керек пе?", "Жоқ. Бір сүйікті кітаптың өзі бастауға жеткілікті."], ["OquNet қай жерде жұмыс істейді?", "OquNet Қазақстан оқырмандарына арналған, қауымдастықтар қалаларда өсіп келеді."]], final: "Жақсы оқу өмірі бір ортақ кітаптан басталады.", finalText: "Сөреңізді бірнеше минутта ашып, жаныңыздағы оқырмандармен танысыңыз.", footer: "Оқырмандар үшін, оқырмандардан.", sticker: "Бірге|оқы", faqText: "OquNet кітап бөлісуді алғашқы амандасудан келесі беруге дейін табиғи ету үшін жасалған.", previewTag: "OquNet ішіне көз жүгіртіңіз", previewTitle: "Оқу қауымдастығы — қалтаңызда.", previewText: "Бүгінгі кітапты тауып, сүйіктілеріңізді сақтаңыз және айналаңыздағы оқырмандардың не оқып жатқанын көріңіз.", previewPoints: ["Жақындағы кітаптарды шолу", "Келесі кітапты кейінге сақтау", "Оқу әлеміңізді бір жерде ұстау"]
  },
  ru: {
    nav: ["Как это работает", "Почему OquNet", "Сообщество", "Вопросы"], login: "Войти", join: "Присоединиться", menu: "Меню", skip: "К содержанию", eyebrow: "Локальное сообщество читателей", hero: "Передай книгу.\nПродолжи историю.", intro: "OquNet — дружелюбное место, чтобы давать книги, находить следующую историю и знакомиться с людьми, которые любят хорошую главу.", primary: "Смотреть сообщество", secondary: "Как это работает", proof: "Настоящие книги. Настоящие читатели.", readers: "читателей уже здесь", note: "Для читателей Казахстана · Бесплатно", ribbon: "Ваша следующая любимая книга может быть в пяти минутах от вас.", storyTag: "Меньше пыли на полках, больше историй", story: "Книги лучше, когда путешествуют.", storyText: "Любимая книга не должна останавливаться на вашей полке. OquNet делает обмен простым, личным и спокойным — чтобы каждая история нашла нового читателя.", stats: ["книг передано", "читателей на связи", "минут чтения"], featureTag: "Одно приложение. Целая читательская жизнь.", featuresTitle: "Всё, чтобы читать вместе.", features: [["⌕", "Находите книги рядом", "Смотрите полки читателей из вашего сообщества."], ["♡", "Давайте с уверенностью", "Знайте, где книга, и делайте каждую передачу понятной."], ["☻", "Читайте вместе", "Обменивайтесь мыслями, заходите в читательскую комнату или встречайтесь офлайн."]], howTag: "Как работает OquNet", how: "Следующая глава книги начинается с вас.", howText: "Без подписок и сложных правил. Просто более спокойный способ делиться любимыми книгами.", steps: [["Создайте полку", "Добавьте книги, которыми готовы поделиться."], ["Найдите следующую книгу", "Откройте книгу и отправьте запрос."], ["Читайте, возвращайте, повторяйте", "Продолжайте разговор — и передавайте любимое дальше."]], communityTag: "Для любопытных людей", community: "Ваши читательские люди уже рядом.", communityText: "От тихого читателя до человека, который подчёркивает каждую страницу — OquNet объединяет людей, для которых книги созданы не только для владения.", communityCta: "Начать полку", quote: "«Книга вернулась с новой запиской внутри. Именно на такое волшебство я надеялась.»", quoteBy: "— читательница из Астаны", faqTag: "Хорошие вопросы", faq: "То, что вам может быть интересно.", faqs: [["OquNet бесплатный?", "Да. Аккаунт, добавление книг и общение в сообществе бесплатны."], ["Я могу выбирать, кому дать книгу?", "Конечно. Вы сами решаете, какие книги добавить, и одобряете каждый запрос."], ["Нужна большая библиотека?", "Совсем нет. Одной любимой книги достаточно, чтобы начать."], ["Где доступен OquNet?", "OquNet создан для читателей Казахстана, сообщества растут в разных городах."]], final: "Лучшая читательская жизнь начинается с одной общей книги.", finalText: "Создайте полку за несколько минут и познакомьтесь с читателями рядом.", footer: "Читателями — для читателей.", sticker: "Читайте|вместе", faqText: "OquNet создан, чтобы обмен книгами ощущался естественно — от первого знакомства до следующей передачи.", previewTag: "Загляните в OquNet", previewTitle: "Целое читательское сообщество в вашем кармане.", previewText: "Найдите книгу на сегодня, сохраните любимые и посмотрите, что читают соседи.", previewPoints: ["Книги читателей рядом", "Сохраните книгу на потом", "Вся ваша читательская жизнь вместе"]
  }
};

export default function Landing() {
  const { lang, setLang } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(false);
  const [faq, setFaq] = useState(0);
  const [stats, setStats] = useState({ books: 1200, users: 400, minutes: 50000 });
  const firstVisit = typeof window !== "undefined" && !window.localStorage.getItem("lang");
  const activeLang = firstVisit ? "en" : lang;
  const c = CONTENT[activeLang] || CONTENT.en;
  const links = ["#how", "#why", "#community", "#faq"];
  const format = (value) => new Intl.NumberFormat(activeLang === "kz" ? "kk-KZ" : activeLang).format(value);

  useEffect(() => {
    getDoc(doc(db, "stats", "global")).then((snapshot) => {
      if (!snapshot.exists()) return;
      const value = snapshot.data();
      setStats({ books: value.totalBooks ?? 1200, users: value.totalUsers ?? 400, minutes: value.totalMinutes ?? 50000 });
    }).catch(() => {});
  }, []);

  // The application defaults to Kazakh once a reader reaches product screens,
  // but an untouched public landing visit is deliberately introduced in English.
  useEffect(() => {
    document.documentElement.lang = activeLang;
  }, [activeLang]);

  useEffect(() => {
    const updateScrollState = () => setIsScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  useEffect(() => {
    const targets = document.querySelectorAll(".reveal-on-scroll");
    if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });
    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [activeLang]);

  const changeLanguage = (next) => { setLang(next); setLanguagesOpen(false); };
  return <main className="landing-page">
    <a className="skip-link" href="#main">{c.skip}</a>
    <header className={`landing-header ${isScrolled ? "is-scrolled" : ""}`}><div className="landing-wrap nav-bar">
      <a href="#top" className="brand" aria-label="OquNet home"><img className="brand-icon" src="/images/oqunet-icon.png" alt=""/>OquNet</a>
      <nav className="desktop-nav">{c.nav.map((item, i) => <a key={item} href={links[i]}>{item}</a>)}</nav>
      <div className="nav-actions"><div className="language-switcher"><button type="button" onClick={() => setLanguagesOpen(!languagesOpen)} aria-expanded={languagesOpen}>◎ {activeLang.toUpperCase()}⌄</button>{languagesOpen && <div className="language-options">{[["en", "English"], ["kz", "Қазақша"], ["ru", "Русский"]].map(([value, label]) => <button key={value} type="button" onClick={() => changeLanguage(value)}>{label}</button>)}</div>}</div><Link to="/auth/login" className="login-link">{c.login}</Link><Link to="/auth/register" className="button button-small">{c.join} <b>→</b></Link></div>
      <button type="button" className="menu-button" aria-label={c.menu} onClick={() => setMenuOpen(!menuOpen)}><i></i><i></i></button>
    </div>{menuOpen && <nav className="mobile-nav">{c.nav.map((item, i) => <a key={item} href={links[i]} onClick={() => setMenuOpen(false)}>{item}</a>)}<Link to="/auth/login">{c.login}</Link><Link to="/auth/register" className="button">{c.join} <b>→</b></Link></nav>}</header>
    <section className="hero" id="top"><div className="landing-wrap hero-grid" id="main"><div className="hero-copy"><p className="eyebrow">{c.eyebrow}</p><h1>{c.hero.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h1><p className="lead">{c.intro}</p><div className="hero-buttons"><Link to="/auth/register" className="button">{c.primary} <b>→</b></Link><a className="underlined-link" href="#how">{c.secondary} →</a></div><div className="proof"><span className="avatars"><i>A</i><i>M</i><i>S</i><i>+</i></span><p><strong>{c.proof}</strong><br />{format(stats.users)}+ {c.readers}</p></div></div><div className="hero-visual"><img src={PHOTO.friends} alt="Friends spending time together with books" /><div className="round-sticker">✦<strong>{c.sticker.split("|").map((line) => <span key={line}>{line}<br /></span>)}</strong></div><div className="number-sticker"><strong>{format(stats.books)}+</strong><span>{c.stats[0]}</span></div></div></div><p className="hero-note">{c.note}</p></section>
    <div className="ribbon"><span>✦</span>{c.ribbon}<span>✦</span></div>
    <section className="section product-preview" id="preview"><div className="landing-wrap product-grid"><div className="preview-copy reveal-on-scroll"><p className="eyebrow">{c.previewTag}</p><h2>{c.previewTitle}</h2><p>{c.previewText}</p><ul>{c.previewPoints.map((point) => <li key={point}><span>✓</span>{point}</li>)}</ul><Link to="/auth/register" className="button">{c.join} <b>→</b></Link></div><figure className="phone-preview reveal-on-scroll"><img src="/images/oqunet-app-preview.png" alt="OquNet books screen on a phone"/><figcaption>OquNet · Кітаптар</figcaption></figure></div></section>
    <section className="section story" id="why"><div className="landing-wrap story-grid"><div className="photo-pair reveal-on-scroll"><img className="library-photo" src={PHOTO.library} alt="A shelf of books in a library"/><div><img src={PHOTO.reader} alt="A person reading a book"/></div><b>✳</b></div><div className="copy-block reveal-on-scroll"><p className="eyebrow">{c.storyTag}</p><h2>{c.story}</h2><p>{c.storyText}</p><div className="stats">{[stats.books, stats.users, stats.minutes].map((value, i) => <div key={c.stats[i]}><strong>{format(value)}+</strong><span>{c.stats[i]}</span></div>)}</div></div></div></section>
    <section className="section features"><div className="landing-wrap"><div className="section-heading reveal-on-scroll"><p className="eyebrow">{c.featureTag}</p><h2>{c.featuresTitle}</h2></div><div className="feature-grid">{c.features.map(([icon, title, text], index) => <article className="reveal-on-scroll" key={title}><span className="feature-icon">{icon}</span><h3>{title}</h3><p>{text}</p><small>0{index + 1}</small></article>)}</div></div></section>
    <section className="section how" id="how"><div className="landing-wrap how-grid"><div className="copy-block"><p className="eyebrow">{c.howTag}</p><h2>{c.how}</h2><p>{c.howText}</p><Link to="/auth/register" className="button cream-button">{c.join} <b>→</b></Link></div><ol>{c.steps.map(([title, text], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{text}</p></div><b>→</b></li>)}</ol></div></section>
    <section className="section community" id="community"><div className="landing-wrap community-grid"><div className="copy-block reveal-on-scroll"><p className="eyebrow">{c.communityTag}</p><h2>{c.community}</h2><p>{c.communityText}</p><Link to="/auth/register" className="underlined-link">{c.communityCta} →</Link></div><aside className="reveal-on-scroll"><span>“</span><blockquote>{c.quote}</blockquote><cite>{c.quoteBy}</cite><b>☼</b></aside></div></section>
    <section className="section faq" id="faq"><div className="landing-wrap faq-grid"><div className="copy-block reveal-on-scroll"><p className="eyebrow">{c.faqTag}</p><h2>{c.faq}</h2><p>{c.faqText}</p></div><div className="faq-list reveal-on-scroll">{c.faqs.map(([question, answer], index) => <article key={question}><button type="button" onClick={() => setFaq(faq === index ? -1 : index)} aria-expanded={faq === index}>{question}<b>{faq === index ? "−" : "+"}</b></button>{faq === index && <p>{answer}</p>}</article>)}</div></div></section>
    <section className="cta"><div className="landing-wrap"><div><p className="eyebrow">OquNet</p><h2>{c.final}</h2><p>{c.finalText}</p></div><Link to="/auth/register" className="button light-button">{c.join} <b>→</b></Link></div></section>
    <footer><div className="landing-wrap"><a href="#top" className="brand"><img className="brand-icon" src="/images/oqunet-icon.png" alt=""/>OquNet</a><p>{c.footer}</p><div><a href="/privacy.html">Privacy</a><a href="/terms.html">Terms</a><span>© 2026 OquNet</span></div></div></footer>
  </main>;
}
