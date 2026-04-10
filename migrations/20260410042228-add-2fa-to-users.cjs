"use strict";

/** @type {import('sequelize-cli').Migration} */
export default {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn("user_account", "two_factor_secret", {
            type: Sequelize.STRING,
            allowNull: true,
        });
        await queryInterface.addColumn("user_account", "two_factor_enabled", {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
    },

    async down(queryInterface, _Sequelize) {
        await queryInterface.removeColumn("user_account", "two_factor_secret");
        await queryInterface.removeColumn("user_account", "two_factor_enabled");
    },
};
