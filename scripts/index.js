const { createIndex, loadAllData, loadDataForStore } = require('./scripts');
const { setUpSchedule } = require('./schedule');

const main = async () => {
    const mode = process.argv.slice(2)[0];
    switch (mode) {
        case 'createIndex':
            await createIndex();
            break;
        case 'loadAllData':
            await loadAllData();
            break;
        case 'loadDataForStore':
            await loadDataForStore(process.argv.slice(3)[0]);
            break;
        case 'loadDataCron':
            setUpSchedule();
            break;
        default:
            console.log('Invalid mode');
    }
};

main().catch(console.log);
