module.exports = {
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "@typescript-eslint/naming-convention": "warn",
        "@typescript-eslint/semi": "warn",
        "curly": ["warn", "multi-line"],
        "eqeqeq": "warn",
        "no-throw-literal": "warn",
        "no-promise-executor-return": "warn",
        "no-template-curly-in-string": "warn",
        "block-scoped-var": "warn",
        "dot-location": "error",
        "dot-notation": "error",
        "no-else-return": "warn",
        "no-empty-function": "warn",
        "no-extra-label": "error",
        "no-labels": "error",
        "no-proto": "error",
        "no-iterator": "error",
        "no-self-compare": "error",
        "no-sequences": "error",
        "no-unmodified-loop-condition": "warn",
        "no-useless-concat": "warn",
        "no-void": "error",
        "no-label-var": "error",
        "no-shadow": "error",
        "no-undef-init": "error",
        "array-bracket-spacing": ["error", "always", { "singleValue": false }],
        "block-spacing": ["warn", "always"],
        "brace-style": ["error"],
        "comma-dangle": ["warn"],
        "comma-spacing": ["warn", { "before": false, "after": true }],
        "func-call-spacing": ["error"],
        "indent": ["error", 2],
        "linebreak-style": "warn",
        "new-cap": "error",
        "new-parens": "error",
        "no-array-constructor": "warn",
        "no-lonely-if": "warn",
        "no-unneeded-ternary": "warn",
        "no-whitespace-before-property": "error",
        "nonblock-statement-body-position": "error",
        "prefer-exponentiation-operator": "warn",
        "quote-props": "error",
        "quotes": ["error","double", { "allowTemplateLiterals": true , "avoidEscape": true }],
        "semi-style": "error",
        "space-before-blocks": "error",
        "space-before-function-paren": ["warn", "never"],
        "space-unary-ops": "error",
        "switch-colon-spacing": "error"
    },
    "ignorePatterns": [
        "out",
        "dist",
        "**/*.d.ts"
    ]
};
