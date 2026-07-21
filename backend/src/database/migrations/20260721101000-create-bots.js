/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("bots", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    companyId: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "AI Support Agent",
    },
    theme: {
      type: Sequelize.STRING,
      defaultValue: "#2563eb",
    },
    avatar: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    welcomeMessage: {
      type: Sequelize.TEXT,
      defaultValue: "Hello! How can I assist you today?",
    },
    language: {
      type: Sequelize.STRING,
      defaultValue: "en",
    },
    temperature: {
      type: Sequelize.FLOAT,
      defaultValue: 0.3,
    },
    model: {
      type: Sequelize.STRING,
      defaultValue: "gpt-4o-mini",
    },
    maxTokens: {
      type: Sequelize.INTEGER,
      defaultValue: 500,
    },
    widgetPosition: {
      type: Sequelize.STRING,
      defaultValue: "bottom-right",
    },
    allowedDomains: {
      type: Sequelize.JSONB,
      defaultValue: [],
    },
    publicKey: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    secretKey: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable("bots");
}
