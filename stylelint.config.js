/** Custom properties set from TSX at runtime (inline `style`) or declared in another module: not in tokens.css. */
const runtimeProperties = {
  '--chat-icon-src': 'none',
  '--devtools-icon-src': 'none',
  '--voice-level': '0',
  '--retro-live-name': 'none',
  '--retro-broken-image': 'none',
  '--retro-tile-stars': 'none',
  '--retro-badge-new': 'none',
};

/** Keywords every tokens-only property accepts. */
const keywords = [
  'inherit',
  'initial',
  'unset',
  'transparent',
  'currentcolor',
  'currentColor',
  'none',
  '0',
];

/** Tokens-only CSS for the site (root AGENTS.md → Conventions), relaxed for the retro show's deliberate 2002 look. */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['stylelint-declaration-strict-value', 'stylelint-value-no-unknown-custom-properties'],
  rules: {
    // `retro-live` is a global view-transition-class shared by RetroMotion.module.css and the TSX that sets it.
    'selector-class-pattern': '^([a-z][a-zA-Z0-9]*|retro-live)$',
    'import-notation': 'string',
    // Its autofix folds readable longhands (top/left/right, transition-*) into one long shorthand.
    'declaration-block-no-redundant-longhand-properties': null,
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': ['rgb', 'rgba', 'hsl', 'hsla'],
    'declaration-no-important': true,
    'selector-max-id': 0,
    'selector-max-compound-selectors': 3,
    'max-nesting-depth': 2,
    'scale-unlimited/declaration-strict-value': [
      ['/color$/', 'font-size', 'font-family', 'border-radius', 'z-index', 'box-shadow'],
      {
        // A key per property replaces the '' defaults, so each list repeats them.
        ignoreValues: {
          '': keywords,
          '/color$/': keywords,
          'border-radius': [...keywords, '50%'], // a circle is not a token
          'box-shadow': [...keywords, 'inset'], // a keyword: lengths and colours are still checked
          'font-size': [...keywords, '100%'], // the root reset to the browser's size
        },
      },
    ],
    'csstools/value-no-unknown-custom-properties': [
      true,
      {
        importFrom: [
          'src/theme/tokens.css',
          'src/screens/retro/LiveConsole.module.css',
          { customProperties: runtimeProperties },
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['src/theme/tokens.css'],
      rules: {
        'color-no-hex': null,
        'color-named': null,
        'function-disallowed-list': null,
        'scale-unlimited/declaration-strict-value': null,
      },
    },
    {
      // The show's broken 2002 page: literal web-safe colours and long hook selectors are the content.
      files: ['src/screens/retro/layers/*.css', 'src/screens/retro/Decorations.module.css'],
      rules: {
        'color-no-hex': null,
        'color-hex-length': null,
        'scale-unlimited/declaration-strict-value': null,
        'selector-max-compound-selectors': null,
        'no-descending-specificity': null,
      },
    },
  ],
};
