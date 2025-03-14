# documentation, progress, and fixes

## sunday, march 9
+ able to deploy app successfully
+ added session state for users to log in with spotify before viewing stats
+ spotify oauth login is not working
+ tried deleting .cache files but still
+ streamlit error: using localhost as redirect_uri does not work

## tues, march 11
+ starting to fix spotipy oauth
    - first by changing localhost from 8000 to streamlit's 8501
+ remember that when deploying, you need to change localhost to a public url
### 11:22pm
+ spotipy oauth now works, but giving spotipy.SpotifyExceptions error when user clicks button
### 11:35
+ should work now cause im a god


## fri, march 14
+ met with bruce, new deadline about 2 weeks
+ new requirements: 
    + converting to karaoke app 
    + lyrics, spotify player
    + maybe migrate to a next.js app
    + needs to be deployed, maybe heroku
