import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
	class Projects extends Model {
		static associate(models) {
			// define association here
		}
	}

	Projects.init({
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
		},
		team_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		title: DataTypes.STRING,
		description: DataTypes.STRING,
		status: DataTypes.STRING,
		deadline: DataTypes.DATEONLY,
	},{
		sequelize,
		modelName: 'Projects',
	});

	return Projects;
};
