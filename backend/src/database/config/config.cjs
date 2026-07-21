require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    use_env_variable: process.env.DATABASE_URL ? "DATABASE_URL" : undefined,
    dialectOptions: process.env.DATABASE_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    } : undefined
  },

  test: {
    username: process.env.DB_USER || process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_TEST_NAME || "HelpFlow_test",
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
    use_env_variable: process.env.DATABASE_URL ? "DATABASE_URL" : undefined,
    dialectOptions: process.env.DATABASE_URL ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    } : undefined
  },

  production: {
    dialect: "postgres",
    logging: false,
    use_env_variable: "DATABASE_URL",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      }
    }
  },
};
