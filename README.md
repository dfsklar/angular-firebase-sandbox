# ProRater -- Angular 

## What this does for you

The ProRater library of AngularJS controllers and services let you easily add comment/rating UX to your existing online "product catalog or "inventory website".

SCREENSHOTS / ANIM-GIFS COMING HERE SOON

## How to install and launch the demo

### Firebase setup

First, you'll need to establish a firebase account and create a firebase project; it's free for this kind of demo/lightweight usage.

In your new project:
* Enable google authentication, as the demo uses only that technique.
* Create a realtime database, and set the rules to:
```
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

Once that firebase project is setup:  In the firebase console, with your project selected, click on "Overview" in the left margin, and then click on "Add Firebase to your web app" and capture the JS code that appears in the popup.  You'll need to place that code (with no revisions) in a file called "credentials.js" right at the root of your local-filesystem clone of this repo.

### Launching the server

You can use any lightweight web server to serve up the files in this repository, since there is zero server-side code here.  This is 100% "static files".  

My favorite technique is to use the excellent BrowserSync environment -- just read the first portion ("how to deliver static files") of https://scotch.io/tutorials/how-to-use-browsersync-for-faster-development and you should up and running in no time.
You can ignore the later sections regarding "gulp" since there is no "build" task needed here.

When you launch the server using BrowserSync, that tool will automatically launch your default browser to show the webapp.  You'll be redirected to google's site for authentication; once authenticated you'll the demo's list of three Broadway shows and you're ready to play!









