'use strict';

require('dotenv').config();

console.log('Newrelic App Name:', process.env.NEW_RELIC_APP_NAME);
console.log('License Key:', process.env.NEW_RELIC_LICENSE_KEY);
console.log('Newrelic Log Level:', process.env.NEWRELIC_LOG_LEVEL);

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: process.env.NEWRELIC_LOG_LEVEL || 'info',
  },
};
