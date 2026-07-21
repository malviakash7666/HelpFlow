export default (sequelize, DataTypes) => {
  const UsageAnalytics = sequelize.define(
    "UsageAnalytics",
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
      totalQueries: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      totalTokensUsed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      ragHits: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      humanEscalations: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      estimatedCost: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "usage_analytics",
      timestamps: true,
    }
  );

  UsageAnalytics.associate = (models) => {
    UsageAnalytics.belongsTo(models.Company, { foreignKey: "companyId", as: "company" });
  };

  return UsageAnalytics;
};
