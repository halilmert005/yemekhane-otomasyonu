module.exports = {
  port: Number(process.env.PORT) || 8000,
  db: {
    yazmaHost: process.env.DB_YAZMA_HOST || 'mysql-primary',
    okumaHost: process.env.DB_OKUMA_HOST || 'mysql-replica',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_ADI || 'yemekhane',
    user: process.env.DB_KULLANICI || 'yemekhane_app',
    password: process.env.DB_SIFRE || 'Uyg_2026',
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
};
