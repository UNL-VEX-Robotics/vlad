import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
	class Users extends Model {
		static associate(models) {
			if (models.Teams) {
				Users.belongsToMany(models.Teams, {
					through: models.UserTeams,
					foreignKey: 'user_id',
					otherKey: 'team_id',
				});
			}
			if (models.Tasks) {
				Users.belongsToMany(models.Tasks, {
					through: models.UserTasks,
					foreignKey: 'user_id',
					otherKey: 'task_id',
				});
			}
		}
	}

	Users.init({
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4
		},
		name: DataTypes.STRING,
		email: DataTypes.STRING,
		password: DataTypes.STRING
	},{
		sequelize,
		modelName: 'Users'
	});

	return Users;
};
