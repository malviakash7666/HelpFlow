/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("usage_analytics", {
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
    totalQueries: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    totalTokensUsed: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    ragHits: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    humanEscalations: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
    estimatedCost: {
      type: Sequelize.FLOAT,
      defaultValue: 0.0,
    },
    date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
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
  await queryInterface.dropTable("usage_analytics");
}
