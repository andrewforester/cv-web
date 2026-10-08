// The compact Stack Overflow card (SPEC.md → Layout → Card) as a DOM builder. Not product code:
// mock.html and render.mjs both call window.stackOverflowCard(state, options).
(() => {
  // The data shape of the brief (cvPage.json → stackOverflow); one sample per state.
  const base = {
    profileUrl: 'https://stackoverflow.com/users/3223198/andrew-panasiuk',
    reputation: 666,
    badges: { gold: 1, silver: 8, bronze: 19 },
    answers: 20,
    topTags: [
      { name: 'android', score: 46 },
      { name: 'gradle', score: 28 },
      { name: 'robolectric', score: 19 },
      { name: 'android-assets', score: 17 },
      { name: 'android-intent', score: 8 },
    ],
    updatedAt: '2026-10-08',
  };
  const samples = {
    default: base,
    hover: base,
    big: {
      ...base,
      reputation: 123456,
      answers: 4321,
      badges: { gold: 123, silver: 1234, bronze: 12345 },
      topTags: [
        { name: 'android-jetpack-compose', score: 104321 },
        { name: 'kotlin-coroutines', score: 98765 },
        { name: 'android-recyclerview', score: 54321 },
      ],
    },
    notags: { ...base, topTags: [] },
    nobadges: {
      ...base,
      reputation: 1,
      answers: 1,
      badges: { gold: 0, silver: 0, bronze: 0 },
      topTags: [{ name: 'android', score: 1 }],
    },
  };

  const num = new Intl.NumberFormat('en-US');
  const logo =
    '<svg class="soIcon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.725 0l-1.72 1.277 6.39 8.588 1.716-1.277L15.725 0zm-3.94 3.418l-1.369 1.644 8.225 6.85 1.369-1.644-8.225-6.85zm-3.15 4.465l-.905 1.94 9.702 4.517.904-1.94-9.701-4.517zm-1.85 4.86l-.44 2.093 10.473 2.201.44-2.092-10.473-2.203zM1.89 15.47V24h19.19v-8.53h-2.133v6.397H4.021v-6.396H1.89zm4.265 2.133v2.13h10.66v-2.13H6.154z"/></svg>';

  window.stackOverflowCard = (state = 'default', { tint = false, wide = false } = {}) => {
    const so = samples[state];
    if (!so) return null; // no stackOverflow data: no card
    const badges = ['gold', 'silver', 'bronze'].filter((kind) => so.badges[kind] > 0);
    const stat = (value, label) =>
      `<span><span class="soValue">${num.format(value)}</span>${label}</span>`;
    const card = document.createElement('section');
    card.className = ['so', tint && 'onTint', wide && 'wide'].filter(Boolean).join(' ');
    card.setAttribute('aria-labelledby', 'so-label');
    card.innerHTML = `
      <div class="soHead">
        <span class="soLabel" id="so-label">${logo}stack overflow</span>
        <a class="soLink${state === 'hover' ? ' isHover isFocus' : ''}" href="${so.profileUrl}" target="_blank" rel="noopener noreferrer">View profile <span aria-hidden="true">↗</span></a>
      </div>
      <div class="soStats">
        ${stat(so.reputation, 'reputation')}
        ${stat(so.answers, so.answers === 1 ? 'answer' : 'answers')}
        ${
          badges.length
            ? `<ul class="soBadges" aria-label="Badges">${badges
                .map(
                  (kind) =>
                    `<li class="soBadge" title="${kind}"><span class="soDot ${kind}" aria-hidden="true"></span><span class="soCount">${num.format(so.badges[kind])}</span><span class="soHidden"> ${kind}</span></li>`,
                )
                .join('')}</ul>`
            : ''
        }
      </div>
      ${
        so.topTags.length
          ? `<ul class="soTags" aria-label="Top tags by answer score">${so.topTags
              .slice(0, 3)
              .map(
                (tag) =>
                  `<li class="soTag"><span class="soTagName">${tag.name}</span><span class="soScore">${num.format(tag.score)}</span></li>`,
              )
              .join('')}</ul>`
          : ''
      }`;
    return card;
  };
})();
