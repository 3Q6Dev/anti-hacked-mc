const db = require('better-sqlite3')('./hackedAccountList.db');
const express = require('express')
const fs = require('fs');
const { resolveSoa } = require('dns');
const app = express()

let exampleUUID = "069a79f444e94726a5befca90e38aaf5" // Notch
let exampleToken = "abcde-fghij@alt.com"

app.get("/api/accountInfo", (req, res) => {
	if(typeof req.query.uuid == 'undefined') {
		res.send(`{"error": true, "msg": "No uuid provided, Example URL: ` + req.get('host') + req.originalUrl + `?uuid=` + exampleUUID + `"}`)
	} else {
		let fixedUUID = req.query.uuid.replace(/-/g, '');
		let sqlResponse = db.prepare(`

		SELECT
			account_uuid,
			account_provider
		FROM
			hacked_account_list
		WHERE
			account_uuid = '${fixedUUID}';

		`).get();
		if(typeof sqlResponse == 'undefined') {
			res.send(`{"error": false, "hackedAccount": false}`);
		} else {
			res.send(`{"error": false, "hackedAccount": true, "accountProvider": "${sqlResponse.account_provider}"}`);
		}
	}
  })

app.get("/api/addAccount", async (req, res) => {
	if(typeof req.query.token == 'undefined') {
		res.send(`{"error": true, "msg": "No token provided, Example URL: ` + req.get('host') + req.originalUrl + `?token=` + exampleToken + `"}`)
	} else {
		const emailDomain = req.query.token.split('@').pop();
		let accountResponse = [];
		let accountProvider = "Unknown";
		if(emailDomain == "alt.com") {
			await verifyAccount(req.query.token, "password", "http://authserver.thealtening.com").then(verifyAccountPacket => {
				accountResponse = verifyAccountPacket;
				accountProvider = "TheAltening";
			});
		} else {
			accountResponse = ["Unknown alt generator service. The supported services are: TheAltening, MCLeaks."];
		}
		
		if(accountResponse[0] == null) {

			let fixedUUID = accountResponse[1].selectedProfile.id.replace(/-/g, '');

			let sqlResponse = db.prepare(`

			SELECT
				account_uuid,
				account_provider
			FROM
				hacked_account_list
			WHERE
				account_uuid = '${fixedUUID}';
	
			`).get();
			if(typeof sqlResponse == 'undefined') {
				db.prepare(`
				INSERT OR IGNORE INTO hacked_account_list(account_uuid, account_provider) VALUES('${accountResponse[1].selectedProfile.id}', '${accountProvider}')
				`).run();
				res.send(`{"error": false, "msg": "Success! Thanks for contributing!"}`)
			} else {
				res.send(`{"error": true, "msg": "Thanks, but this account is already in our list."}`);
			}

			/*
			db.prepare(`
			INSERT OR IGNORE INTO hacked_account_list(account_uuid, account_provider) VALUES('${accountResponse[1].selectedProfile.id}', '${accountProvider}')
			`).run();
			*/
		} else {
			res.send(`{"error": true, "msg": "${accountResponse[0]}"}`)
		}
		
	}
})

app.get("/api/accountCount", async (req, res) => {
	let sqlResponse = db.prepare(`
	
	SELECT Count(*) FROM hacked_account_list

	`).get();
	res.send(`{"count": ${sqlResponse['Count(*)']}}`);
})

app.get("/", async (req, res) => {
	res.send(fs.readFileSync('./pages/index.html', 'utf8'));
})

app.get("/docs", async (req, res) => {
	res.send(fs.readFileSync('./pages/docs.html', 'utf8'));
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
		}, function(err, data){
			verifyAccountPacket([err, data]);
		});
	})
}

app.listen(80);
