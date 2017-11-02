const HEADER_REGEXP = /bearer token-(.*)$/;

module.exports.authenticate = async function ({ headers: { authorization } }, Users) {
	const email = authorization && HEADER_REGEXP.exec(authorization)[1];
	return email && await Users.findOne({ email });
}
