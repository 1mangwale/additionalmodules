module.exports = {
  apps: [
    {
      name: 'mangwale-gateway',
      cwd: __dirname + '/../../apps/gateway',
      script: 'node',
      args: 'dist/main.js',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'mangwale-movies',
      cwd: __dirname + '/../../apps/movies',
      script: 'node',
      args: 'dist/main.js',
      env: {
        NODE_ENV: 'production'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
    ,
    {
      name: 'mangwale-search',
      cwd: __dirname + '/../../../Search',
      script: 'node',
      args: 'dist/search-api/src/main.js',
      env: { NODE_ENV: 'production', PORT: 3000 },
      env_production: { NODE_ENV: 'production', PORT: 3000 }
    }
  ]
}
