var config = {
  retrieval: true,
  suggestion: true,
  adaptation: true,
  autocompletion: true,
  server: "localhost",
  port: 3030,
  dr: {
    enable: false,
    server: "localhost:3000",
    endpoint: "/businessRules"
  },
  debug: true
};

export default config;
