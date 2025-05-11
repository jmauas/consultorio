module.exports = {
  apps: [{
    name: 'Consultorio App',
    script: './src/server.mjs',
    args: 'start --p 3013',
    watch: false,
    ignore_watch: ['node_modules', 'public'],
    exec_mode: "fork",
    instances: 1,
    autorestart: true,
    log_file: '../locales/logs/logs.txt',
    out_file: '../locales/logs/out.txt',
    error_file: '../locales/logs/error.txt',
    append: true
  }]
};