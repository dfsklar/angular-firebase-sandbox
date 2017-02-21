# ProRater (Angular Edition) 

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



## How to incorporate into your app

It is fairly easy to add Angular to any web application -- as long as it is not already using a client-side framework (such as React).  

For this discussion, I assume you are already using Angular... or you are NOT yet using a sophisticated client-side framework for data-binding and page dynamics.

### The required components

Some of the demo's code is composed of files that are relevant only to the Broadway-show demo.  
You can use those as guides but you don't need to bring them into your code repository.

The core files -- i.e. the ones you won't need to edit -- that compose the ProRater system are:
* `controller_reviewprez.js` -- This is the Angular controller that takes care of providing the logic that drives the templates
  that paint the rating star strips and the list of "commentblocks".
* `directives/ratingStarstrip/ratingStarstrip.js` -- Code supporting the display of and interaction with the "star strips".
* `directives/ratingStarstrip/ratingStarstrip.css` -- Styling for the "star strips" (and of course you may want to play with this, but this provides a good start).

### The services
In addition, you must provide two angular "services" to help the system understand the context:
* the identity of the user who is viewing the current product / inventory item, and
* a way to fetch the reviews for this product / inventory item.

#### 1) The user-identity service

If your application already has the concept of "user identity" and authentication, you'll want to create your own variation 
of the "reference" user service that we've provided in `service_user_firebase.js`.   Your service must support two mandatory endpoints:
* `setUser(userInfo)`
* `getUserInfo()`

The `setUser` endpoint should be invoked by your web application to let ProRater know who the current user is.  (You can see sample use of that endpoint in the file `demo_login.js`.)  

The `userInfo` JavaScript Map object must contain two properties:
* `uid`: this user's unique identifier, a string who semantics need not be understood by ProRater.
* `meta`: a Map object containing any number of properties that might be useful to the templates you will build to display the "author" information as part of the commentblocks.  In the demo, we're using several basic metadata properties that google's authentication provides, such as name, email, and photo image -- but the set of metadata properties are really up to you.  You just need to make sure to provide any metadata needed for display of the commentblocks.

If you don't yet have authentication in your application, and google authentication is good enough for your purposes, feel free to  use the `service_user_firebase.js` as-is!


#### 1) The database-access service

If you want to start out using firebase as the database for persistence of the reviews, feel free to do so; you can thus
use the file `service_db_firebase.js` as-is.  However, be aware that because this data service has the client talking directly to the NoSQL database, with no "middle tier", there are security issues.  (Firebase can be used in a secure way, but by no means is my demo data service using firebase in an ironclad way!)  Consider it an environment that is for prototyping or for a "beta" release, but not a way to deliver this feature into a production environment with confidence.

The preferred method for scalability and security is to adapt `service_db_firebase.js` to have it use a protocol such as AJAX to read/write via secured, authenticaed communication with a server.  The file has good commentary on all the public endpoints required; obviously, it's API is mostly about adding/editing/removing commentblocks and is quite straightforward.



