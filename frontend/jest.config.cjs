module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
    },
    moduleFileExtensions: ["js", "jsx", "ts", "tsx"],
    setupFilesAfterEnv: ["@testing-library/jest-dom"],
    setupFiles: ["<rootDir>/jest.setup.js"],
    moduleNameMapper: {
        // Mock image imports
        "\\.(jpg|jpeg|png|gif|svg)$": "<rootDir>/__mocks__/fileMock.js",
        // Mock style imports
        "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/fileMock.js",
        // Mock lottie-react to avoid canvas usage in jsdom
        "^lottie-react$": "<rootDir>/__mocks__/lottieReactMock.js",
    },
    roots: ["<rootDir>/src"],
};
