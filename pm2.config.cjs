module.exports = {
  apps: [{
    name: 'Consultorio App',
    script: 'npm',
    args: 'start --p 3006',
    watch: false,
    ignore_watch: ['node_modules', 'public'],
    exec_mode: "fork",
    instances: 1,
    autorestart: true,
    log_file: '../logs/logs.txt',
    out_file: '../logs/out.txt',
    error_file: '../logs/error.txt',
    append: true
  }]
};