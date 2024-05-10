const { Client } = require('@elastic/elasticsearch');
const fs = require('fs');
const readline = require('readline');
const { Transform } = require('stream');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
const client = new Client({
    node: 'http://localhost:9200',
});

const CHUNK_SIZE = 5000; // Adjust this value based on your needs
const INDEX_NAME = 'products';

const createIndex = async () => {
    try {
        await client.indices.delete({ index: INDEX_NAME });
    } catch (e) {
        //dont care, probably index doesnt exist
    }

    await client.indices.create({
        index: INDEX_NAME,
        body: {
            mappings: {
                properties: {
                    supermarket: { type: 'keyword' },
                    price: { type: 'double' },
                    price_per_unit: { type: 'double' },
                    unit: { type: 'keyword' },
                    name: { type: 'text' },
                    date: { type: 'date' },
                    category: { type: 'keyword' },
                    own_brand: { type: 'boolean' },
                },
            },
        },
    });
};

const HEADERS = [
    { key: 'supermarket', type: 'string', parse: (value) => value },
    { key: 'price', type: 'float', parse: (value) => parseFloat(value) },
    {
        key: 'price_per_unit',
        type: 'float',
        parse: (value) => parseFloat(value),
    },
    { key: 'unit', type: 'string', parse: (value) => value },
    { key: 'name', type: 'string', parse: (value) => value },
    {
        key: 'date',
        type: 'date',
        parse: (value) => {
            const date = value.split('');
            // I mean... it works
            return `${date[0]}${date[1]}${date[2]}${date[3]}-${date[4]}${date[5]}-${date[6]}${date[7]}`;
        },
    },
    { key: 'category', type: 'string', parse: (value) => value },
    { key: 'own_brand', type: 'boolean', parse: (value) => value === 'True' },
];

const loadAllData = async () => {
    const files = fs.readdirSync('../data');

    for (const file of files) {
        const readStream = fs.createReadStream(`../data/${file}`, 'utf-8');
        const lineReader = readline.createInterface({ input: readStream });

        const transformStream = new Transform({
            readableObjectMode: true,
            writableObjectMode: true,
            transform(line, encoding, callback) {
                if (!this.buffer) {
                    this.buffer = [];
                }

                if (line) {
                    const productArray = line.split(',');
                    const product = {};
                    for (let j = 0; j < HEADERS.length; j++) {
                        product[HEADERS[j].key] = HEADERS[j].parse(
                            productArray[j]
                        );
                    }
                    this.buffer.push(product);

                    if (this.buffer.length >= CHUNK_SIZE) {
                        this.push(this.buffer);
                        this.buffer = [];
                    }
                }

                callback();
            },
            flush(callback) {
                if (this.buffer && this.buffer.length > 0) {
                    this.push(this.buffer);
                }
                callback();
            },
        });

        const bulkInsertStream = new Transform({
            readableObjectMode: true,
            writableObjectMode: true,
            async transform(chunk, encoding, callback) {
                const body = chunk.flatMap((doc) => [
                    { index: { _index: INDEX_NAME } },
                    doc,
                ]);
                await client.bulk({ refresh: true, body });
                callback();
            },
        });

        await pipeline(lineReader, transformStream, bulkInsertStream);

        console.log(`Loaded ${file}`);
    }

    console.log('Products loaded successfully!');
};

const loadDataForStore = async (store) => {
    if (!fs.existsSync(`../data/All_Data_${store}.csv`)) {
        console.log(`File ../data/All_Data_${store}.csv does not exist`);
        return;
    }
    const readStream = fs.createReadStream(
        `../data/All_Data_${store}.csv`,
        'utf-8'
    );
    const lineReader = readline.createInterface({ input: readStream });
    const transformStream = new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        transform(line, encoding, callback) {
            if (!this.buffer) {
                this.buffer = [];
            }

            if (line) {
                const productArray = line.split(',');
                const product = {};
                for (let j = 0; j < HEADERS.length; j++) {
                    product[HEADERS[j].key] = HEADERS[j].parse(productArray[j]);
                }
                this.buffer.push(product);

                if (this.buffer.length >= CHUNK_SIZE) {
                    this.push(this.buffer);
                    this.buffer = [];
                }
            }

            callback();
        },
        flush(callback) {
            if (this.buffer && this.buffer.length > 0) {
                this.push(this.buffer);
            }
            callback();
        },
    });

    const bulkInsertStream = new Transform({
        readableObjectMode: true,
        writableObjectMode: true,
        async transform(chunk, encoding, callback) {
            const body = chunk.flatMap((doc) => [
                { index: { _index: INDEX_NAME } },
                doc,
            ]);
            //await client.bulk({ refresh: true, body });
            console.log(chunk);
            callback();
        },
    });

    await pipeline(lineReader, transformStream, bulkInsertStream);

    console.log(`Loaded ${file}`);
};

module.exports = { createIndex, loadAllData, loadDataForStore };
