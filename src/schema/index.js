const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

// Types definitions
const typeDefs = `
	type Link {
		id: ID!
		url: String!
		description: String!
		postedBy: User
	}

	type User {
		id: ID!
		name: String!
		email: String
	}

	type SigninPayload {
		token: String
		user: User
	}

	type Query {
		allLinks: [Link!]!
	}

	type Mutation {
		createLink(url: String!, description: String!): Link
		createUser(name: String!, authProvider: AuthProviderSignupData!): User
		signinUser(credentials: AUTH_PROVIDER): SigninPayload!
	}

	input AuthProviderSignupData {
		credentials: AUTH_PROVIDER
	}

	input AUTH_PROVIDER {
		email: String!
		password: String!
	}
`;

module.exports = makeExecutableSchema({ typeDefs, resolvers });
