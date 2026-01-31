import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
	class Teams extends Model {
		static associate(models) {
			Teams.belongsTo(models.Teams, {
				as: 'Parent',
				foreignKey: 'parent_team',
			});
			Teams.hasMany(models.Teams, {
				as: 'Children',
				foreignKey: 'parent_team',
			});
			if (models.Users) {
				Teams.belongsToMany(models.Users, {
					through: models.UserTeams,
					foreignKey: 'team_id',
					otherKey: 'user_id',
				});
			}
		}
	}

	Teams.init({
		id: {
			type: DataTypes.UUID,
			primaryKey: true,
			defaultValue: DataTypes.UUIDV4,
		},
		name: DataTypes.STRING,
		parent_team: {
			type: DataTypes.UUID,
			allowNull: true,
			references: {
				model: 'Teams',
				key: 'id',
			},
		},
	},{
		sequelize,
		modelName: 'Teams',
	});

	return Teams;
};
