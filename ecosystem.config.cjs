// PM2 process file. Deploys go through scripts/deploy.sh (build, migrations,
// `pm2 startOrReload ecosystem.config.cjs`). Runtime settings (PORT=3005, ORIGIN, …) live in .env.
module.exports = {
	apps: [
		{
			name: 'leocadenses',
			script: './build/index.js',
			// The member-card template and fonts are read from ./assets (src/lib/server/members).
			cwd: __dirname,
			node_args: '--env-file=.env',
			// Login and form throttling are in memory: keep a single instance.
			instances: 1,
			exec_mode: 'fork',
			autorestart: true,
			max_memory_restart: '384M',
			env: {
				NODE_ENV: 'production'
			}
		}
	]
};
