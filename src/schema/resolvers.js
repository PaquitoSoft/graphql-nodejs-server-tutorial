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

// Queries
async function allLinks(root, data, context) {
	const { mongo: { Links } } = context;
	return await Links.find({}).toArray();
}

// Mutations
async function createLink(root, data, context) {
	const { mongo: { Links }, user } = context;
	const response = await Links.insert({ ...data, postedById: user && user._id });
	return { ...data, id: response.insertedIds[0] };
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

module.exports = {
	Query: { allLinks },
	Mutation: { createLink, createUser, signinUser, createVote },
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
