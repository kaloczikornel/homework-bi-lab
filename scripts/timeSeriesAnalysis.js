const tf = require('@tensorflow/tfjs');
const fs = require('fs');
const readline = require('readline');
const { Transform } = require('stream');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
require('@tensorflow/tfjs-node');

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

function process_Xy(raw_X, raw_y, lookback) {
    const X = new Array(raw_X.length - lookback);
    const y = new Array(raw_y.length - lookback);

    for (let i = lookback; i < raw_X.length; i++) {
        X[i - lookback] = raw_X.slice(i - lookback, i);
        y[i - lookback] = raw_y[i];
    }

    return [X, y];
}

const analysis = async () => {
    // Load data from file
    const readStream = fs.createReadStream(
        `../data/All_Data_Aldi.csv`,
        'utf-8'
    );
    const data = [];
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
                // Filter out products that are not household or does not have a valid price_per_unit (it can be 0)
                // and drop the columns that are not needed for the analysis
                if (
                    product.category === 'household' &&
                    product.price_per_unit
                ) {
                    data.push({
                        date: product.date,
                        pricePerUnit: product.price_per_unit,
                        price: product.price,
                    });
                }
            }

            callback();
        },
    });

    await pipeline(lineReader, transformStream);

    const trainData = data.slice(0, Math.floor(data.length * 0.2));
    const validData = data.slice(
        Math.floor(data.length * 0.2),
        Math.floor(data.length * 0.4)
    );
    const testData = data.slice(Math.floor(data.length * 0.4), data.length);

    const timeSteps = 1; // Define your time steps here

    // Reshape input data
    // const inputTensorDataReshaped = trainData
    //     .map((data, i, array) => {
    //         if (i >= timeSteps) {
    //             return [array.slice(i - timeSteps, i)];
    //         }
    //     })
    //     .filter((data) => data !== undefined); // Remove undefined values
    // console.log(inputTensorDataReshaped[0]);

    const [inputTensorDataReshaped, outputTensorDataReshaped] = process_Xy(
        trainData.map((d) => [new Date(d.date).getTime(), d.price]),
        trainData.map((d) => d.price),
        timeSteps
    );

    const mappedData = trainData.map((d) => [
        new Date(d.date).getTime(),
        d.price,
    ]);
    const inputTensorReshaped = tf.tensor2d(mappedData, [
        mappedData.length,
        mappedData[0].length,
    ]);

    const train_X = tf.reshape(inputTensorReshaped, [
        inputTensorReshaped.shape[0],
        1,
        inputTensorReshaped.shape[1],
    ]);

    // const outputTensorDataReshaped = trainData
    //     .map((data, i, array) => {
    //         if (i >= timeSteps) {
    //             return [array[i].price];
    //         }
    //     })
    //     .filter((data) => data !== undefined); // Remove undefined values
    const outputTensorReshaped = tf.tensor2d(outputTensorDataReshaped, [
        outputTensorDataReshaped.length,
        1,
    ]);

    const inputTensor = tf.tensor2d(
        trainData.map((d) => [new Date(d.date).getTime(), d.price])
    );
    const outputTensor = tf.tensor2d(
        trainData.map((d) => [new Date(d.date).getTime()])
    );

    const inputValidTensor = tf.tensor2d(
        validData.map((d) => [new Date(d.date).getTime(), d.price])
    );
    const outputValidTensor = tf.tensor2d(validData.map((d) => [d.price]));

    console.log(inputTensorReshaped.shape);

    // Define and compile the model
    const model = tf.sequential();
    model.add(
        tf.layers.lstm({
            units: 16,
            inputShape: [train_X.shape[1], train_X.shape[2]],
            activation: 'relu',
        })
    );
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({ loss: 'meanSquaredError', optimizer: 'adam' });

    // Train the model
    async function trainModel() {
        await model.fit(train_X, outputTensor, {
            epochs: 100,
            batch_size: 32,
            //validationData: [inputValidTensor, outputValidTensor],
            verbose: 1,
        });
        console.log('Model trained');
    }

    trainModel().then(() => {
        // Now you can make predictions
        // const newInput = tf.tensor3d(
        //     testData
        //         .map((data, i, array) => {
        //             if (i >= timeSteps) {
        //                 return [array.slice(i - timeSteps, i)];
        //             }
        //         })
        //         .filter((data) => data !== undefined)
        // );
        // const [input] = process_Xy(
        //     testData.map((d) => ({
        //         date: new Date(d.date).getTime(),
        //         price: d.price,
        //     })),
        //     testData.map((d) => d.price),
        //     timeSteps
        // );
        // const newInput = tf.tensor3d(input, [input.length, 1, input[0].length]);
        const mappedData = testData.map((d) => [
            new Date(d.date).getTime(),
            d.price,
        ]);
        const inputTensorReshaped = tf.tensor2d(mappedData, [
            mappedData.length,
            mappedData[0].length,
        ]);

        const test = tf.reshape(inputTensorReshaped, [
            inputTensorReshaped.shape[0],
            1,
            inputTensorReshaped.shape[1],
        ]);
        // const newInput = tf.tensor2d(
        //     testData.map((d) => [new Date(d.date).getTime(), d.price])
        // );
        const predictions = model.predict(test);
        predictions.print();
    });
};

analysis().catch(console.log);
