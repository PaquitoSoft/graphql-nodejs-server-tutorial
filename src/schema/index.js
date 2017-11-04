const { makeExecutableSchema } = require('graphql-tools');
const resolvers = require('./resolvers');

// Types definitions
const typeDefs = `
	type Link {
		id: ID!
		url: String!
		description: String!
		postedBy: User
		votes: [Vote!]!
	}

	type User {
		id: ID!
		name: String!
		email: String
		votes: [Vote!]!
	}

	type SigninPayload {
		token: String
		user: User
	}

	type Vote {
		id: ID!
		user: User!
		link: Link!
	}

	type Query {
		allLinks: [Link!]!
	}

	type Mutation {
		createLink(url: String!, description: String!): Link
		createVote(linkId: ID!): Vote
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
