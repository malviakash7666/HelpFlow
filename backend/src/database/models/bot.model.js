export default (sequelize, DataTypes) => {
  const Bot = sequelize.define(
    "Bot",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      companyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "AI Support Agent",
      },
      theme: {
        type: DataTypes.STRING,
        defaultValue: "#2563eb",
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      welcomeMessage: {
        type: DataTypes.TEXT,
        defaultValue: "Hello! How can I assist you today?",
      },
      language: {
        type: DataTypes.STRING,
        defaultValue: "en",
      },
      temperature: {
        type: DataTypes.FLOAT,
        defaultValue: 0.3,
      },
      model: {
        type: DataTypes.STRING,
        defaultValue: "gpt-4o-mini",
      },
      maxTokens: {
        type: DataTypes.INTEGER,
        defaultValue: 500,
      },
      widgetPosition: {
        type: DataTypes.STRING,
        defaultValue: "bottom-right",
      },
      allowedDomains: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      publicKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: () => "pk_" + Math.random().toString(36).substring(2) + Date.now().toString(36),
      },
      secretKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        defaultValue: () => "sk_" + Math.random().toString(36).substring(2) + Date.now().toString(36),
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "bots",
      timestamps: true,
    }
  );

  Bot.associate = (models) => {
    Bot.belongsTo(models.Company, { foreignKey: "companyId", as: "company" });
  };

  return Bot;
};
