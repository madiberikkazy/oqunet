# Ответ на Guideline 2.1 — Information Needed

Текст ниже — на английском, вставляется в App Store Connect **дважды**:
в Reply to App Review и в App Review Information → Notes.

---

## 1. Demo account

```
Username: madi
Password: OquNetTest01
```

The login field accepts either a nickname or an email address.
This account is already a member of a community with books, posts and chats,
so every feature is reachable immediately after signing in.

## 2. App purpose and target audience

OquNet is a book-sharing app for small, closed communities — neighbours,
classmates, colleagues, or a book club.

**The problem it solves.** A paperback someone has finished sits unread on a
shelf for years, while somebody nearby is looking for that exact book. Public
book-swap services fail at the last step: two strangers still have to trust
each other enough to meet. OquNet scopes the exchange to a community you are
already part of, so the person collecting your book is someone your community
admitted.

**Target audience.** Readers in Kazakhstan, aged 16–40, in Kazakh, Russian and
English. The app is free, has no advertising and no in-app purchases.

**How it works.** A member adds books they are willing to lend. Another member
requests one, they agree on a meeting in the in-app chat, and at the handover
the holder reads out a four-digit code that transfers the book in the app. The
app also tracks reading time and progress, and has a community feed.

## 3. Setting up and accessing the main features

1. Launch the app and sign in with the demo account above.
2. **Books tab** — the community's shelf. Tap any book to see its detail page,
   its owner and its history. "Pickup" starts a borrow request.
3. **Home tab** — the community feed. The "+" button writes a post.
4. **Chats tab** — conversations with other members.
5. **Profile tab** — reading statistics, owned books, and Settings.

**Content reporting (required by guideline 1.2):** the "⋮" menu on any post,
comment or user profile contains "Report". It opens a dialog with a reason and
an optional note. Reports are reviewed within 24 hours.

**Blocking:** the same "⋮" menu contains "Block". A blocked person's posts and
comments disappear from the reader's feed and they can no longer send messages
— this is enforced by database security rules, not only by the interface.
Blocked users are listed under Settings → Blocked, where blocking can be undone.

**Account deletion:** Settings → Delete account. The account and its profile
data are removed permanently.

**Terms of use:** shown in full inside the app during registration, with
explicit Agree / Decline buttons. Acceptance is recorded on the user's profile
together with the version of the wording that was displayed.

## 4. External services used

| Service | Purpose |
|---|---|
| Firebase Authentication (Google) | email/password and Google sign-in |
| Cloud Firestore (Google) | application database |
| Firebase Storage (Google) | user-uploaded images (avatars, book covers) |
| Telegram Bot API | optional phone-number verification |
| Vercel | hosting for the privacy policy and terms pages |

There are no payment processors, no advertising networks, no analytics
providers and no AI services. Push notifications are disabled in this version.

The Facebook SDK appears in the binary as a transitive dependency of the
Firebase authentication plugin. It is never initialized and no Facebook
functionality is offered in the app.

## 5. Regional differences

None. The app behaves identically in every region. It is localised into Kazakh,
Russian and English, selectable in Settings and independent of the device
region. Content differs only by which community a user belongs to, not by
country.

## 6. Regulated industry / third-party material

OquNet does not operate in a regulated industry and provides no regulated
services.

The app ships no third-party content of its own. Book titles, authors and cover
images are entered by users for books they physically own. The terms of use,
which every user accepts at registration, require users to have the right to
the material they upload and prohibit infringing content. Reported material is
reviewed within 24 hours and removed when it violates those terms.

Privacy policy: https://oqunet.vercel.app/privacy.html
Terms of use: https://oqunet.vercel.app/terms.html
Support: https://t.me/oqunetapp
