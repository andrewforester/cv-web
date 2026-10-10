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

/** Tokens-only CSS for the site (root AGENTS.md → Conventions), relaxed for the retro show's deliberate 2002 look. */
export default {
  extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
  plugins: ['stylelint-declaration-strict-value', 'stylelint-value-no-unknown-custom-properties'],
  rules: {
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',
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
          '': ['inherit', 'transparent', 'currentcolor', 'none', '0', 'initial', 'unset'],
          '/color$/': ['inherit', 'transparent', 'currentcolor', 'none', 'initial', 'unset'],
          'border-radius': ['inherit', '0', '50%', 'initial', 'unset'],
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
