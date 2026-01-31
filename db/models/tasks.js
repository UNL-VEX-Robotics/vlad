import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
	class Tasks extends Model {
		static associate(models) {
			if (models.Users) {
				Tasks.belongsToMany(models.Users, {
					through: models.UserTasks,
					foreignKey: 'task_id',
					otherKey: 'user_id',
				});
			}
		}
	}

	Tasks.init({
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
		},
		project_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		title: DataTypes.STRING,
		description: DataTypes.STRING,
		status: DataTypes.STRING,
		deadline: DataTypes.DATEONLY,
	},{
		sequelize,
		modelName: 'Tasks',
	});

	return Tasks;
};
