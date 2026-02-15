module.exports = {
  apps: [{
    name: 'phishing-defense',
    script: 'server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      JWT_SECRET: 'CHANGE_THIS_IN_PRODUCTION'
    },
    error_file: '../phishing-data/logs/pm2-error.log',
    out_file: '../phishing-data/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 5000,
    listen_timeout: 10000
  }]
};
