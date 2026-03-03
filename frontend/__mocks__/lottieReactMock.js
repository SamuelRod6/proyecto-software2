const React = require("react");

function LottieMock(props) {
  const { animationData, ...rest } = props || {};
  return React.createElement("div", {
    "data-testid": "lottie-mock",
    ...rest,
  });
}

module.exports = LottieMock;
