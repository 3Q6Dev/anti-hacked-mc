const db = require('better-sqlite3')('./hackedAccountList.db');
const express = require('express')
const axios = require('axios')
const fs = require('fs');
const app = express()

app.get("/api/accountInfo", (req, res) => {
	if(typeof req.query.uuid == 'undefined') {
		res.send({"success": false, "msg": "No uuid provided."})
	} else {
		let fixedUUID = req.query.uuid.replace(/-/g, '');
		let sqlResponse = db.prepare(`

		SELECT
			account_uuid,
			account_provider,
			account_token,
			account_time_added
		FROM
			hacked_account_list
		WHERE
			account_uuid = '${fixedUUID}';

		`).get();
		if(typeof sqlResponse == 'undefined') {
			res.send({"success": true, "hackedAccount": false});
		} else {
			res.send({"success": true, "hackedAccount": true, "accountProvider": sqlResponse.account_provider, "accountToken": sqlResponse.account_token, "accountTimeAdded": sqlResponse.account_time_added});
		}
	}
  })

app.get("/api/addAccount", async (req, res) => {
	if(typeof req.query.token == 'undefined') {
		res.send({"success": false, "error": `No token provided.`})
	} else {
		getUUIDFromToken(req.query.token).then(getUUIDFromTokenPacket => {
			if(getUUIDFromTokenPacket.success == true) {
				let sqlResponse = db.prepare(`

				SELECT
					account_uuid
				FROM
					hacked_account_list
				WHERE
					account_uuid = '${getUUIDFromTokenPacket.response}';
		
				`).get();
				if(typeof sqlResponse == 'undefined') {
					db.prepare(`
					INSERT OR IGNORE INTO hacked_account_list(account_uuid, account_provider, account_token, account_time_added) VALUES('${getUUIDFromTokenPacket.response}', '${getUUIDFromTokenPacket.provider}', '${req.query.token}', '${Math.floor(new Date() / 1000)}')
					`).run();
					res.send({"success": true, "response": "Success! Thanks for contributing!", "uuid": getUUIDFromTokenPacket.response, "provider": getUUIDFromTokenPacket.provider})
				} else {
					res.send({"success": false, "error": "Thanks, but this account is already in our list."});
				}
	
				/*
				db.prepare(`
				INSERT OR IGNORE INTO hacked_account_list(account_uuid, account_provider) VALUES('${accountResponse[1].selectedProfile.id}', '${accountProvider}')
				`).run();
				*/
			} else {
				res.send({"success": false, "error": `${getUUIDFromTokenPacket.error}`});
			}
		});
	}


})

app.get("/api/accountCount", async (req, res) => {
	let theAlteningSQLResponse = db.prepare(`
	
	SELECT Count(*) FROM hacked_account_list WHERE account_provider = 'TheAltening';

	`).get();
	let mcleaksSQLResponse = db.prepare(`
	
	SELECT Count(*) FROM hacked_account_list WHERE account_provider = 'MCLeaks';

	`).get();

	let theAlteningAccountCount = theAlteningSQLResponse['Count(*)']
	let mcleaksAccountCount = mcleaksSQLResponse['Count(*)']

	let totalAccountCount = (theAlteningAccountCount + mcleaksAccountCount)

	res.send({"total": totalAccountCount, "TheAltening": theAlteningAccountCount, "MCLeaks": mcleaksAccountCount});
})

app.get("/", async (req, res) => {
	res.send(fs.readFileSync('./pages/index.html', 'utf8'));
})

app.get("/docs", async (req, res) => {
	res.send(fs.readFileSync('./pages/docs.html', 'utf8'));
})

app.get("/sitemap.txt", async (req, res) => {
	res.send(fs.readFileSync('./pages/sitemap.txt', 'utf8'));
})

app.use(function(req, res) {
	res.status(404).send(fs.readFileSync('./pages/not_found.html', 'utf8'));
});

async function verifyAccount(username, password, authServer) {
	return new Promise(verifyAccountPacket => {
		const ygg = require('yggdrasil')({
			//Optional settings object
			host: authServer //Optional custom host. No trailing slash.
		});
		
		//Authenticate a user
		ygg.auth({
			/*
			token: '', //Optional. Client token.
			agent: '', //Agent name. Defaults to 'Minecraft'
			version: 1, //Agent version. Defaults to 1
			*/
			user: username, //Username
			pass: password //Password
		}, function(error, data){
			verifyAccountPacket({"success": error == null, "response": data, "error": `${error}`}); // If error is not set, success = true (For some reason, the typeof error is an object, but the value of it (while empty) is null.)
		});
	})
}

async function getUUIDFromToken(accountToken) {
	return new Promise(getUUIDFromTokenPacket => {



		const emailDomain = accountToken.split('@').pop(); // While .pop() removes the last element from an array, it also returns the removed value, so if the email was 'hello@example.com', then we .split('@'), it would be ['hello', 'example.com'], then we .pop() the last value (which also returns the last value), to get the domain name 'example.com'

		if(emailDomain == "alt.com") {
			verifyAccount(accountToken, "password", "http://authserver.thealtening.com").then(verifyAccountPacket => {
				if(verifyAccountPacket.success == true) {
					getUUIDFromTokenPacket({"success": true, "response": verifyAccountPacket.response.selectedProfile.id.replace(/-/g, ''), "provider": "TheAltening"})
				} else {
					getUUIDFromTokenPacket({"success": false, "response": verifyAccountPacket.response, "error": `${verifyAccountPacket.error}`})
				}
			});
		} else {
			verifyMCLeaks(accountToken).then(verifyAccountPacket => {

				if(verifyAccountPacket.success == true) { // Verifying that the request itself was successful

					if(verifyAccountPacket.response.success == true) { // Verifying that the response from MCLeaks was successful

						getUUIDFromUsername(verifyAccountPacket.response.result.mcname).then(getUUIDFromUsernamePacket => {

							if(getUUIDFromUsernamePacket.success == true) {
								getUUIDFromTokenPacket({"success": true, "response": getUUIDFromUsernamePacket.response.id.replace(/-/g, '')})
							} else {
								getUUIDFromTokenPacket({"success": false, "error": getUUIDFromUsernamePacket.error})
							}

						});

					} else {
						getUUIDFromTokenPacket({"success": false, "error": verifyAccountPacket.response.errorMessage})
					}
				} else {
					getUUIDFromTokenPacket({"success": false, "error": verifyAccountPacket.error})
				}
			});
		}



	})
}

async function verifyMCLeaks(accountToken) {
	return new Promise(verifyAccountPacket => {
		axios.post('https://auth.mcleaks.net/v1/redeem', {
			token: accountToken
		})
		.then(function (response) {
			verifyAccountPacket({"success": true, "response": response.data})
		})
		.catch(function (error) {
			verifyAccountPacket({"success": false, "error": error})
		})
	})
}

async function getUUIDFromUsername(username) {
	return new Promise(getUUIDFromUsernamePacket => {
		axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`,)
		.then(function (response) {
			getUUIDFromUsernamePacket({"success": true, "response": response.data})
		})
		.catch(function (error) {
			getUUIDFromUsernamePacket({"success": false, "error": error})
		})
	})
}

async function main() {
	db.prepare(`
	CREATE TABLE IF NOT EXISTS hacked_account_list (
		account_uuid TEXT PRIMARY KEY,
		account_provider TEXT NOT NULL,
		account_token TEXT NOT NULL,
		account_time_added INTEGER NOT NULL
	 );
	`).run();
}

main();

app.listen(80);
