# SQS Insight
This tool provides an insight into [AWS SQS](https://aws.amazon.com/de/sqs/) Queues or [ElasticMQ](https://github.com/adamw/elasticmq) Queues. ElasticMQ is a nice Project to Mock  Queues locally, as it provides the same API interface as SQS, but unfortunately does not ship with a GUI.

## Setup
Clone this repo, then cd into it and run `npm install` to install required dependencies.

Otherwise, you also may install it via `npm install finanzcheck/sqs-insight`.

## Configure
Copy `config/config.json` to `config/config_local.json` and change it to meet your needs. The following fields are mandatory:
- `port` - the port to bind the GUI to
- `rememberMessages` - How many messages should be stored? <-- This fixes the problem, that a queue consumer is not aware about messages, that were handled by other consumers
- `endpoints` - An array of Objects defining the sqs api endpoints for the queues you want to get an insight to. Each Object needs to have the following keys defined:

```json
{
    "key": "notValidKey",
    "secretKey": "notValidSecret",
    "region": "eu-central-1",
    "url": "http://sqs.amazonaws.com/my-user/my-queue"
}
```

## Start
run `npm start`, `node index.js` in development or `NODE_ENV=production node index.js` to run it in production mode.

## Access the GUI
Open [http://localhost:3000](http://localhost:3000) in your browser, or change the port to the one you set in config_local.
