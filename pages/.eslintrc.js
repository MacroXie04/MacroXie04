module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    // Warn about console statements (CI will check for these)
    'no-console': 'warn',
    // Warn about debugger statements
    'no-debugger': 'warn',
    // Warn about unused variables
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    // Ensure consistent spacing
    'indent': ['error', 2],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'semi': ['error', 'always'],
    // React specific rules
    'react/prop-types': 'off', // Since you're not using TypeScript
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
  },
  overrides: [
    {
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
    },
  ],
};
