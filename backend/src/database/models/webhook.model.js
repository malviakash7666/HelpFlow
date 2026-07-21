export default (sequelize, DataTypes) => {
  const Webhook = sequelize.define(
    "Webhook",
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
      url: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      events: {
        type: DataTypes.JSONB,
        defaultValue: ["chat.started", "chat.ended", "ticket.created", "human.handoff"],
      },
      secret: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: () => "whsec_" + Math.random().toString(36).substring(2) + Date.now().toString(36),
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "webhooks",
      timestamps: true,
    }
  );

  Webhook.associate = (models) => {
    Webhook.belongsTo(models.Company, { foreignKey: "companyId", as: "company" });
  };

  return Webhook;
};
