# ♦ 🚢 Offshore Simulator { Under construction } 👷

- ABOUT THE GAME:

This is an educational offshore operations game, built with HTML, CSS and JavaScript. Offshore Simulator is an educational browser game set aboard the fictional FPSO Comandante Ancunín in the Santos Basin. Players explore a simplified offshore process, adjust controls and interpret instrument readings. The project brings together web development, game design and accessibility.

- WHY I MADE IT:

 This project aims to support offshore instrumentation training through an engaging, game-based learning experience that helps learners explore industry concepts and practice problem-solving in simulated scenarios. It also provides an opportunity for learners to expand their technical English vocabulary and deepen their understanding of the Oil & Gas industry, while allowing me to strengthen my web development skills, with a focus on accessibility, responsive design and user experience.

- GAME OBJECTIVE:

Solve short operational challenges by bringing process variables into their target ranges and keeping them stable. Players learn through actions and feedback, with further explanations available when needed.

-  CORE GAME TASKS:

Observe the current state, identify the priorities and make adjustments in order to stabilize the system.

<img src="assets/Offshore simulator-readmegithub.png" alt="Notebook mostrando captura de tela do site do simulator de plataforma de petróleo" width="100%"></img>

## ♦ Technologies used

**No frameworks.**.

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



## ♦ How progress is saved

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
