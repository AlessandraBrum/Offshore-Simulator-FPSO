# 🚢 Offshore Simulator { Under construction } 👷

This is the public preview: the intro, the soundtrack, the privacy notice and the phase menu. The phases open as soon as they are ready. Project currently under construction. Keep an eye out for updates!

• This is an educational offshore operations game, built with HTML, CSS and JavaScript.

• My goal with this project is to improve my technical English skills, increase my web development knowledge in terms of accessibility, responsiveness and user experience and also exercise my generative AI for coding knowledge, as well as learn more about the Oil & Gas industry, considering I have worked for 9 years for technical and legal translations companies and I have always kept in touch with technical documents. I have also had the opportunity to have conversations about this topic with engineers in my private life, being so amazed about it that this subject inspired me to learn about how the oil treatment and oil platforms work.

## Technologies used

**No framework.** I did not use React, Vue, npm or any external library.

- **HTML** for the structure: text, buttons, menus.
- **CSS** for the appearance.
- Plain **JavaScript** for the behavior.

The reasons:

1. **Nothing to install or compile.** With React, for example, you would have to install Node and run a "build" step before seeing the result. Here, you open `index.html` and it just works.
2. **Simple publishing.** GitHub Pages publishes the game folder exactly as it is.
3. **Code that is readable for anyone reviewing the portfolio.** Recruiters can see a solid command of the web's fundamentals, without relying on tools that hide what is going on.
4. **Lightness and privacy.** With no third-party libraries, no other company's code runs on the page.

Some features the browser itself provides, with nothing to install:

- **Canvas**: draws the opening storm and the valve camera, frame by frame.
- **Web Audio**: generates the music and the thunder in code, note by note. There is no audio file at all.
- **`<dialog>`**: the phase menu window, which comes with the correct keyboard behavior built in.
- **localStorage**: the browser's "drawer" where progress is saved (explained below).

## How progress is saved

1. **Where:** in `localStorage`, a space that every browser sets aside for each website. It stores name/value pairs as text. The data stays only in that browser, on that device, and is never sent to any server.
2. **What is saved:**
   - `oc-consent`: the answer to the privacy notice (`yes` or `no`);
   - `oc-progress`: the list of completed phases, for example `["phase2"]`;
   - `oc-motion`: whether the player turned the animations off.
3. **What controls it:** the `Store` block, in section 1.1 of `js/main.js`. Before writing or reading any data, it checks whether the player accepted the notice (`oc-consent` equal to `yes`). Without that consent, nothing is written.
4. **When it writes:** when the player completes the Phase 2 mission in the challenge, section 8 (Mission and training) calls `Phases.complete('phase2')`, which uses `Store` to save the list of phases.
5. **How to erase it:** with the game's "Erase my progress" button, or by clearing the site's data in the browser.
6. **How to see it:** open the game in Chrome, press F12 and go to Application › Local Storage.

The commands used are built into the browser: `localStorage.setItem` writes, `getItem` reads and `removeItem` deletes. Each one is wrapped in `try/catch`. That way, if the browser blocks storage, as in a private window, the game keeps working and simply does not remember the progress.

The full guide, including the LGPD (Brazil's General Data Protection Law) section, is in `assets/privacy-lgpd.md`.
