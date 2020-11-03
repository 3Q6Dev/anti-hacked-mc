## I highly recommend you host this yourself instead of using our website.
### I highly recommend you host this yourself instead of using our website.
#### I highly recommend you host this yourself instead of using our website.

Our website is only up for demonstation purposes, and may not last long term.

Currently supports: ``TheAltening``, ``MCLeaks``.

Usage: https://anti-hacked-mc.ml/docs

How it works:

Users submit "account tokens" they recieve from websites like https://thealtening.com/, and submit them to https://anti-hacked-mc.ml/, we then authenticate the token via the account generator's auth server, which gives us the account's UUID (Unique User Identification, every Minecraft user has one, and it never changes.) and then add it to our database. You can then submit a GET request to our server with a player's uuid to find out whether it is a hacked Minecraft account. (See more on our documentation.)
