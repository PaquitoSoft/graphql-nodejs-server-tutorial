const express = require('express');
const bodyParser = require('body-parser');

// This package will handle GraphQL server requests and responses
// based on the provided schema definition
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const schema = require('./schema');

// Packages for subscription server
const { execute, subscribe } = require('graphql');
const { createServer } = require('http');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const connectToMongo = require('./connectors/mongo-connector');
const { authenticate } = require('./authentication');
const buildDataLoaders = require('./data-loaders/data-loaders');
const formatError = require('./format-error');

const SERVER_PORT = 3000;

const start = async () => {
	const mongo = await connectToMongo();
	const app = express();

	app.use('/graphql', bodyParser.json(), graphqlExpress(async (req/*, res*/) => {
		const user = await authenticate(req, mongo.Users);
		return {
			context: {
				dataloaders: buildDataLoaders(mongo),
				mongo,
				user
			},
			formatError,
			schema
		}
	}));
	app.use('/graphiql', graphiqlExpress({
		endpointURL: '/graphql',
		passHeader: `'Authorization': 'bearer token-paquitosoftware@gmail.com'`,
		subscriptionsEndpoint: `ws://localhost:${SERVER_PORT}/subscriptions`
	}));

	// app.listen(SERVER_PORT, () => {
	// 	console.log(`Hackernews GrapQL server running on SERVER_port ${SERVER_PORT}`);
	// });
	const server = createServer(app);
	server.listen(SERVER_PORT, () => {
		SubscriptionServer.create(
			{ execute, subscribe, schema },
			{ server, path: '/subscriptions' }
		);
		console.log(`Hackernews GrapQL server running on SERVER_port ${SERVER_PORT}`);
	});
};

start();
