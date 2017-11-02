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

// Queries
async function allLinks(root, data, context) {
	const { mongo: { Links } } = context;
	return await Links.find({}).toArray();
}

// Mutations
async function createLink(root, data, context) {
	const { mongo: { Links } } = context;
	const response = await Links.insert(data);
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
	Mutation: { createLink, createUser, signinUser },
	Link: {
		id: root => root._id || root.id
	},
	User: {
		id: root => root._id || root.id
	}
};
