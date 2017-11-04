const express = require('express');
const bodyParser = require('body-parser');

// This package will handle GraphQL server requests and responses
// based on the provided schema definition
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const schema = require('./schema');

const connectToMongo = require('./connectors/mongo-connector');
const { authenticate } = require('./authentication');
const buildDataLoaders = require('./data-loaders/data-loaders');

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
			schema
		}
	}));
	app.use('/graphiql', graphiqlExpress({
		endpointURL: '/graphql',
		passHeader: `'Authorization': 'bearer token-paquitosoftware@gmail.com'`
	}));

	app.listen(SERVER_PORT, () => {
		console.log(`Hackernews GrapQL server running on SERVER_port ${SERVER_PORT}`);
	});
};

start();
