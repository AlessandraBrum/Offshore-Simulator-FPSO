# Offshore Simulator · Guide to saved data and the LGPD

A step-by-step guide to understanding how the game stores progress, what the LGPD (Brazil's General Data Protection Law, Law No. 13,709/2018) requires, and how someone can contact you about privacy.

---

## Part 1 · How the game saves progress

### Step 1 · What the "cache" used by the game really is
The game does not actually use the cache. It uses **localStorage**, a small drawer that every browser offers to each website. The key differences:

- The **cache** stores copies of files (images, scripts) so the site opens faster. The browser decides when to delete them.
- **localStorage** stores pairs of text, in name/value format, that the site itself writes. The data only disappears when the site deletes it or when the person clears their browser data.

Each site has its own drawer, kept separate from every other site's drawer. It lives only in that browser, on that device. If the person opens the game on their phone, the progress from their computer will not show up there.

### Step 2 · What Offshore Simulator saves

| Name (key) | Example value | What it is for | When it is saved |
|---|---|---|---|
| `oc-consent` | `yes` or `no` | Remember the answer to the privacy notice | As soon as the person answers |
| `oc-progress` | `["fase2"]` | List of completed phases | Only with consent |
| `oc-motion` | `off` | Remember that the person turned the animations off | Only with consent |

Nothing else. No name, e-mail, IP address or identifier.

### Step 3 · How this looks in the code
In `js/main.js`, block **1.1 Storage with consent** controls everything:

```js
Store.set('oc-progress', '["fase2"]');   // only writes if oc-consent is "yes"
Store.get('oc-progress');                // only reads if oc-consent is "yes"
Store.eraseAll();                         // erases progress and preference
```

Under the hood, it uses the browser commands `localStorage.setItem`, `getItem` and `removeItem`. Each command sits inside a `try/catch`: if the browser blocks storage (in a private window, for example), the game keeps working, it just does not remember anything.

### Step 4 · How to see the data with your own eyes
1. Open the game in Chrome or Edge.
2. Press **F12**, or right-click and choose **Inspect**.
3. Go to the **Application** tab (in Firefox, **Storage**).
4. In the left-hand menu, open **Local Storage** and click the game's address.
5. The keys `oc-consent`, `oc-progress` and `oc-motion` appear. You can delete them one by one with the Delete key.

### Step 5 · The consent flow
1. On the first visit, the "Save your progress on this device?" banner appears at the bottom of the screen.
2. Before the person answers, nothing is saved.
3. **Save my progress:** saves `oc-consent = yes`, and from then on progress is saved.
4. **Don't save:** saves only `oc-consent = no`, so the notice does not come back on every visit. Progress lasts only while the page is open.
5. **Erase my progress** (Phases menu › Privacy and progress): erases everything and goes back to "don't save".

---

## Part 2 · The LGPD applied to the game

### Step 6 · What the LGPD is
The *Lei Geral de Proteção de Dados* (General Data Protection Law, Law No. 13,709/2018) regulates the use of **personal data** in Brazil. It applies to websites, apps and games, including free ones and those made by a single person, whenever they process data from people in Brazil. Enforcement is carried out by the **ANPD** (Brazil's National Data Protection Authority).

### Step 7 · Personal data or not?
Under Art. 5, item I, personal data is any information that identifies a person or could identify them. The game progress (`["fase2"]`) on its own does not identify anyone and never leaves the device, so it is probably not even personal data.

Even so, asking for consent and explaining everything is the safest and most transparent approach. It also shows care to anyone reviewing your portfolio.

### Step 8 · The roles under the law and where you fit in
- **Data subject:** the person playing.
- **Controller:** whoever decides why and how the data is used. In Offshore Simulator, that is you.
- **Data protection officer (DPO, *encarregado*):** the point of contact for data subjects and for the ANPD (Art. 41). CD/ANPD Resolution No. 2/2022 exempts small-scale processing agents, a category that includes individuals, from appointing a DPO. In return, they must provide a **communication channel** for data subjects. The contact e-mail in the notice fulfills that role.

### Step 9 · Legal basis
Every use of data needs a legal basis (Art. 7). The game relies on **consent** (Art. 7, item I). To be valid, consent must be:
- **freely given:** the game works exactly the same if the person declines;
- **informed:** the notice says what is saved, why and where;
- **unambiguous:** the person clicks a button, and nothing is pre-selected by default;
- **revocable at any time** (Art. 8, §5): the "Erase my progress" button takes care of this.

### Step 10 · Players' rights (Art. 18)
Among other things, the person can request:
- confirmation that data about them exists, and access to it;
- correction or deletion of the data;
- information about who the data is shared with;
- withdrawal of consent.

In the game, almost all of this is already in the person's own hands, because the data stays on their device. If someone asks by e-mail, the answer is usually simple: you have no access to any data, because nothing ever reaches you.

### Step 11 · Two points to watch outside the game
1. **Fonts:** resolved on October 13, 2026. The fonts now live in the game's own `fonts/` folder (with their OFL licenses), and the privacy notice has an "Other sites" line explaining this to players. When you publish on GitHub, upload the `fonts/` folder along with everything else.
2. **Hosting:** on GitHub Pages, GitHub logs visits (IP address, browser) on its own servers, as any hosting service does. It is worth mentioning this in the notice, with a link to GitHub's privacy policy.

---

## Part 3 · How someone can get in touch or file a complaint

### Step 12 · The person's path
1. **First, with you:** the person opens the privacy notice and finds the "Contact" line with your e-mail address. They write to you with their question, request or complaint.
2. **Your reply:** under Art. 19, a request to confirm that data exists or to access it must be answered either immediately, in a simplified form, or in full within **15 days**. The notice promises a reply within 15 days.
3. **If the person is not satisfied:** they can file a petition with the ANPD through gov.br (gov.br/anpd, in the data subject services area). The ANPD usually asks for proof that the person first tried to resolve the matter with the controller.

### Step 13 · How to reply to a request
A short template for an access or deletion request:

> Hi! Thank you for getting in touch. Offshore Simulator does not send any data to servers: progress is stored only in the player's own browser. For that reason, I have no access to any of your information. To erase everything, open the game, go to Phases › Privacy and progress and click "Erase my progress", or clear the site's data in your browser. Please let me know if there is anything else I can help with.

### Step 14 · Good practices to keep up
- Keep the e-mails you receive and the replies you send, as proof that requests were handled.
- If the game ever starts sending data to a server (leaderboard, login, analytics), the notice and this guide must be updated **before** that change goes live.

---

*This guide is technical guidance, not a legal opinion. For commercial or institutional use, it is worth having it reviewed by a digital law professional.*
