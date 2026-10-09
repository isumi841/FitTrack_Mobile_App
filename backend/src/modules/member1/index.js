const { createApp } = require('./app');
const { loadConfig } = require('./config');

/** Mount only Member 1 endpoints; keep one database connection and server. */
function createMember1Middleware({ env = process.env, buildApp } = {}) {
  let member1App;
  return (req, res, next) => {
    if (!/^\/api\/(auth|users)(?:\/|$)/.test(req.path)) return next();
    try {
      if (!member1App) {
        const config = loadConfig(env);
        if (buildApp) member1App = buildApp(config);
        else {
          const { createEmailService } = require('./services/email');
          const { createAuthRouter } = require('./routes/auth');
          const { createUsersRouter } = require('./routes/users');
          const { sendVerificationEmail } = createEmailService(config);
          member1App = createApp({
            config,
            authRouter: createAuthRouter({ config, sendVerificationEmail }),
            usersRouter: createUsersRouter({ config }),
          });
        }
      }
      return member1App(req, res, next);
    } catch {
      // Missing new credentials must not prevent the existing modules starting.
      return res.status(503).json({ success: false, message: 'Authentication is not configured. Complete the Member 1 settings in backend/.env and restart the backend.' });
    }
  };
}

module.exports = { createMember1Middleware };
