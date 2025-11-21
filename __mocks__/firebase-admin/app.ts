const apps: Array<Record<string, unknown>> = [];

export const cert = jest.fn((credentials: Record<string, unknown>) => credentials);
export const getApps = jest.fn(() => apps);
export const initializeApp = jest.fn((options: Record<string, unknown>) => {
  const app = { options };
  apps.push(app);
  return app;
});

export default {
  cert,
  getApps,
  initializeApp,
};
