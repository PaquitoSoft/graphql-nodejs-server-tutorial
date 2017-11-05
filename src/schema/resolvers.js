// const links = [
// 	{
// 		id: 1,
// 		url: 'http://graphql.org/',
// 		description: 'The Best Query Language'
// 	},
// 	{
// 		id: 2,
// 		url: 'http://dev.apollodata.com',
// 		description: 'Awesome GraphQL Client'
// 	},
// ];

// module.exports = {
// 	Query: {
// 		allLinks: () => links
// 	},
// 	Mutation: {
// 		createLink: (_, data) => {
// 			const newLink = { ...data, id: links.length + 1 };
// 			links.push(newLink);
// 			return newLink;
// 		}
// 	}
// };

const { ObjectID } = require('mongodb');
const pubsub = require('../pub-sub');

class ValidationError extends Error {
	constructor(message, field) {
		super(message);
		this.field = field;
	}
}

function validateLink(url) {
	if (!/^https?/.test(url)) {
		throw new ValidationError('Link validation error: invalid url.', 'url');
	}
}

function buildFilters({ OR = [], description_contains, url_contains }) {
	const filter = (description_contains || url_contains) ? {} : null;

	if (description_contains) {
		filter.description = { $regex: `.*${description_contains}.*` };
	}

	if (url_contains) {
		filter.url = { $regex: `.*${url_contains}.*` };
	}

	let filters = filter ? [filter] : [];
	for (let i = 0; i < OR.length; i++) {
		filters = filters.concat(buildFilters(OR[i]));
	}

	return filters;
}

// Queries
async function allLinks(root, { filter, first, skip }, context) {
	const { mongo: { Links } } = context;
	const query = filter ? { $or: buildFilters(filter) } : {};
	const cursor = Links.find(query);
	if (first) {
		cursor.limit(first);
	}
	if (skip) {
		cursor.skip(skip);
	}
	return await cursor.toArray();
}

// Mutations
async function createLink(root, data, context) {
	const { mongo: { Links }, user } = context;
	validateLink(data.url);

	const newLink = {
		...data,
		postedById: user && user._id
	};
	const response = await Links.insert(newLink);

	newLink.id = response.insertedIds[0];
	pubsub.publish('Link', {
		Link: {
			mutation: 'CREATED',
			node: newLink
		}
	});

	return newLink;

	// const response = await Links.insert({ ...data, postedById: user && user._id });
	// return { ...data, id: response.insertedIds[0] };
}

async function createUser(root, data, context) {
	const { mongo: { Users } } = context;
	const newUser = {
		name: data.name,
		email: data.authProvider.credentials.email,
		password: data.authProvider.credentials.password
	};
	const response = await Users.insert(newUser);
	return {
		...newUser,
		id: response.insertedIds[0]
	}
}

async function createVote(root, data, context) {
	const { mongo: { Votes }, user } = context;
	const newVote = {
		userId: user && user._id,
		linkId: new ObjectID(data.linkId)
	};
	const response = await Votes.insert(newVote);
	return { ...newVote, id: response.insertedIds[0] };
}

async function signinUser(root, data, context) {
	const { mongo: { Users } } = context;
	const user = await Users.findOne({ email: data.credentials.email });
	if (data.credentials.password === user.password) {
		return { token: `token-${user.email}`, user };
	} else {
		// TODO What should be the response in this case?
		console.log('Password does not match');
	}
}

// Subscriptions
function subscribe() {
	return pubsub.asyncIterator('Link');
}

module.exports = {
	Query: { allLinks },
	Mutation: { createLink, createUser, signinUser, createVote },
	Subscription: {
		Link: { subscribe }
	},
	Link: {
		id: root => root._id || root.id,
		postedBy: async ({ postedById }, data, context) => {
			// const { mongo: { Users } } = context;
			// return await Users.findOne({ _id: postedById });
			const { dataloaders: { userLoader } } = context;
			return await userLoader.load(postedById);
		},
		votes: async ({ _id }, data, context) => {
			const { mongo: { Votes } } = context;
			return await Votes.find({ linkId: _id }).toArray();
		}
	},
	User: {
		id: root => root._id || root.id,
		votes: async ({ _id }, data, context) => {
			const { mongo: { Votes } } = context;
			return await Votes.find({ userId: _id }).toArray();
		}
	},
	Vote: {
		id: root => root._id || root.id,
		user: async ({ userId }, data, context) => {
			// const { mongo: { Users } } = context;
			// return await Users.findOne({ _id: userId });
			const { dataloaders: { userLoader } } = context;
			return await userLoader.load(userId);
		},
		link: async ({ linkId }, data, context) => {
			const { mongo: { Links } } = context;
			return await Links.findOne({ _id: linkId });
		}
	}
};
