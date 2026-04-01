import pool from "../db.js";
import { withLayout } from "../views/layout.js";
import { settingsPage } from "../views/settings.view.js";

export const renderSettings = async (req, res) =>{
    const content = settingsPage();
    res.send(withLayout("Settings", content, req));

}