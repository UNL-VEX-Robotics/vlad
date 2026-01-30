import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
  class UserTasks extends Model {
    static associate(models) {
      // define association here
    }
  }

  UserTasks.init({
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    task_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  },{
    sequelize,
    modelName: 'UserTasks',
    tableName: 'UserTasks',
  });

  return UserTasks;
};
