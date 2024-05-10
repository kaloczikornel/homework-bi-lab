const cron = require('node-cron');
const { Client } = require('@elastic/elasticsearch');
const { loadAllData } = require('./scripts');

const client = new Client({
    node: 'http://localhost:9200',
});

module.exports = {
    setUpSchedule: () => {
        // make a schedule for every monday at 00:00
        cron.schedule('0 0 * * 1', async () => {
            await loadAllData(client);
        });
    },
};
