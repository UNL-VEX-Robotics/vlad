'use strict';
/** @type {import('sequelize-cli').Migration} */
const { randomUUID } = require('crypto');

module.exports = {
	async up(queryInterface, Sequelize) {
		const [[{ count: teamCount }]] = await queryInterface.sequelize.query(
			'SELECT COUNT(*)::int AS count FROM "Teams";'
		);
		if (teamCount !== 0) {
			return;
		}

		const now = new Date();
		const teamId = randomUUID();
		const userId = randomUUID();
		const projectId = randomUUID();

		await queryInterface.bulkInsert('Teams', [{
			id: teamId,
			name: 'SKERS',
			createdAt: now,
			updatedAt: now,
		}]);

		await queryInterface.bulkInsert('Users', [{
			id: userId,
			name: 'SKERS_Admin',
			email: 'skers.vurc@gmail.com',
			password: '$2b$12$examplehashhere',
			createdAt: now,
			updatedAt: now,
		}]);

		await queryInterface.bulkInsert('UserTeams', [{
			id: randomUUID(),
			user_id: userId,
			team_id: teamId,
			createdAt: now,
			updatedAt: now,
		}]);

		await queryInterface.bulkInsert('Projects', [{
			id: projectId,
			team_id: teamId,
			title: 'VLAD',
			description: 'VEX Logging & Assignment Dashboard',
			status: null,
			deadline: null,
			createdAt: now,
			updatedAt: now,
		}]);
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.bulkDelete('Projects', null, {});
		await queryInterface.bulkDelete('UserTeams', null, {});
		await queryInterface.bulkDelete('Users', null, {});
		await queryInterface.bulkDelete('Teams', null, {});
	}
};
