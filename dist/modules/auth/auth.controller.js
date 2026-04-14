"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
const auth_service_1 = require("./auth.service");
async function register(req, res) {
    try {
        const { email, password } = req.body;
        const token = await (0, auth_service_1.registerUser)(email, password);
        res.json({ token });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        const token = await (0, auth_service_1.loginUser)(email, password);
        res.json({ token });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
