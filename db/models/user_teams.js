import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class UserTeams extends Model {
    static associate(models) {
      // define association here
    }
  }

  UserTeams.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    team_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },{
    sequelize,
    modelName: 'UserTeams',
    tableName: 'UserTeams',
  });

  return UserTeams;
};
