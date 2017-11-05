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

	type LinkSubscriptionPayload {
		mutation_in: _ModelMutationType!
		node: Link
	}

	type Query {
		allLinks(filter: LinkFilter, skip: Int, first: Int): [Link!]!
	}

	type Mutation {
		createLink(url: String!, description: String!): Link
		createVote(linkId: ID!): Vote
		createUser(name: String!, authProvider: AuthProviderSignupData!): User
		signinUser(credentials: AUTH_PROVIDER): SigninPayload!
	}

	type Subscription {
		Link(filter: LinkSubscriptionFilter): LinkSubscriptionPayload
	}

	input AuthProviderSignupData {
		credentials: AUTH_PROVIDER
	}

	input AUTH_PROVIDER {
		email: String!
		password: String!
	}

	input LinkSubscriptionFilter {
		mutation_in: [_ModelMutationType!]
	}

	input LinkFilter {
		OR: [LinkFilter!]
		description_contains: String
		url_contains: String
	}

	enum _ModelMutationType {
		CREATED
		UPDATED
		DELETED
	}
`;

module.exports = makeExecutableSchema({ typeDefs, resolvers });
