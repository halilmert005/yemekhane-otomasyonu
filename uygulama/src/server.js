const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`Yemekhane uygulama servisi ${env.port} portunda dinleniyor.`);
});
