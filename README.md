# anti-hacked-mc
A community-power solution to minecraft account generators such as TheAltening and MCLeaks

## I highly recommend you host this yourself instead of using our website.

Currently supports: ``TheAltening``, ``MCLeaks``.

Usage: https://anti-hacked-mc.ml/docs

How it works:

Users submit "account tokens" they recieve from websites like https://thealtening.com/, and submit them to https://anti-hacked-mc.ml/, we then authenticate the token via the account generator's auth server, which gives us the account's UUID (Unique User Identification, every Minecraft user has one, and it never changes.) and then add it to our database. You can then submit a GET request to our server with a player's uuid to find out whether it is a hacked Minecraft account. (See more on our documentation.)

Every once in a while, I will release our sqlite3 database containing the hacked account UUID's, but remember that these are **never** as up to date as using our API.
