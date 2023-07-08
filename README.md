# Bossett's little feed collection

Playing around with Bluesky's custom feeds. Very basic - just a small iteration on the template for the moment, to grab a user list, and then look for specific terms in posts from those users.

## Science Feed

Watches for 🧪 posted by people on a set of watchlists (e.g. https://bsky.app/profile/did:plc:jfhpnnst6flqway4eaeqzj2a/lists/3jx3w32axax2f)

Feed at https://bsky.app/profile/did:plc:jfhpnnst6flqway4eaeqzj2a/feed/for-science

## Major TODOs

Some level of caching needs to go in - possibly just a cache header in feed-generation.ts - not a huge deal right now, but may be important in the future.

## To set up one of your own:

Set up things you'll need on Bluesky:
* Create a mutelist.
    * Add the accounts you want the feed to follow here. (Make sure to get their permission first!)
    * Record its URL; you'll use it to create `env.FEEDGEN_LISTS`.
* Create an app password.
    * Record this; you'll use it as `env.FEEDGEN_PASSWORD`.

Customize your environment variables:
* Copy `.env.example` to `.env`.
* Update it according to the inline instructions.
* For `FEEDGEN_HOSTNAME`, use `${APP_URL}`.
    * Your actual URL won't exisst until after your first successful deployment, so you'll need to use this dynamic reference.

Set up your hosting:
* Fork this code to your account.
* Sign up for a DigitalOcean account, if needed.
* At DigitalOcean:
    * Create a new app.
    * Authorize it on your forked repo.
    * Update the plan info. (The basic plan is cheapest. You only need one copy of the web service under your app.)
    * On the environment variables step:
        * Go to global > bulk editor.
        * Copy-paste `.env`.
        * After DigitalOcean parses this, make sure to encrypt your `FEEDGEN_PASSWORD`.
    * [Configure health checks](https://docs.digitalocean.com/support/my-app-deployment-failed-because-of-a-health-check/) to use HTTP. The endpoint you need is `/.well-known/did.json` (the same feed name you set in `.env`).
    * Total cost is $10/month.

