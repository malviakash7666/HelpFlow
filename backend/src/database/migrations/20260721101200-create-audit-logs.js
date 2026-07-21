/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("audit_logs", {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    companyId: {
      type: Sequelize.UUID,
      allowNull: true,
    },
    action: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    actorId: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    ipAddress: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    details: {
      type: Sequelize.TEXT,
      allowNull: true,
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
  await queryInterface.dropTable("audit_logs");
}
