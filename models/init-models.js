import { DataTypes } from "sequelize";
import _notifications from "./notifications.model.js";
import _project from "./project.model.js";
import _subteam from "./subteam.model.js";
import _task from "./task.model.js";
import _task_assignee from "./task_assignee.model.js";
import _team from "./team.model.js";
import _user_account from "./user_account.model.js";
import _user_settings from "./user_settings.model.js";
import _user_subteam from "./user_subteam.model.js";

function initModels(sequelize) {
    const notifications = _notifications(sequelize, DataTypes);
    const project = _project(sequelize, DataTypes);
    const subteam = _subteam(sequelize, DataTypes);
    const task = _task(sequelize, DataTypes);
    const task_assignee = _task_assignee(sequelize, DataTypes);
    const team = _team(sequelize, DataTypes);
    const user_account = _user_account(sequelize, DataTypes);
    const user_settings = _user_settings(sequelize, DataTypes);
    const user_subteam = _user_subteam(sequelize, DataTypes);

    task.belongsTo(project, { as: "project", foreignKey: "project_id" });
    project.hasMany(task, { as: "tasks", foreignKey: "project_id" });
    project.belongsTo(subteam, { as: "subteam", foreignKey: "subteam_id" });
    subteam.hasMany(project, { as: "projects", foreignKey: "subteam_id" });
    user_subteam.belongsTo(subteam, { as: "subteam", foreignKey: "subteam_id" });
    subteam.hasMany(user_subteam, { as: "user_subteams", foreignKey: "subteam_id" });
    task_assignee.belongsTo(task, { as: "task", foreignKey: "task_id" });
    task.hasMany(task_assignee, { as: "task_assignees", foreignKey: "task_id" });
    subteam.belongsTo(team, { as: "team", foreignKey: "team_id" });
    team.hasMany(subteam, { as: "subteams", foreignKey: "team_id" });
    user_account.belongsTo(team, { as: "team", foreignKey: "team_id" });
    team.hasMany(user_account, { as: "user_accounts", foreignKey: "team_id" });
    notifications.belongsTo(user_account, { as: "user", foreignKey: "user_id" });
    user_account.hasMany(notifications, { as: "notifications", foreignKey: "user_id" });
    project.belongsTo(user_account, { as: "lead", foreignKey: "lead_id" });
    user_account.hasMany(project, { as: "projects", foreignKey: "lead_id" });
    subteam.belongsTo(user_account, { as: "lead", foreignKey: "lead_id" });
    user_account.hasMany(subteam, { as: "subteams", foreignKey: "lead_id" });
    team.belongsTo(user_account, { as: "lead", foreignKey: "lead_id" });
    user_account.hasMany(team, { as: "teams", foreignKey: "lead_id" });
    user_settings.belongsTo(user_account, { as: "user", foreignKey: "user_id" });
    user_account.hasOne(user_settings, { as: "user_settings", foreignKey: "user_id" });

    return {
        notifications,
        project,
        subteam,
        task,
        task_assignee,
        team,
        user_account,
        user_settings,
        user_subteam,
    };
}
export default initModels;
