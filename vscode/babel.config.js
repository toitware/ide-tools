// babel.config.js
module.exports = {
  "presets": [
    [ "@babel/preset-env", {"targets": {"node": "current"}} ],
    "@babel/preset-typescript",
    "@babel/preset-env"
  ],
  "env": {
    "test": {
      "plugins": ["@babel/plugin-transform-modules-commonjs"]
    }
  }
};
